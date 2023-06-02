// #![deny(warnings)]
use std::collections::HashMap;
use std::sync::Arc;

use futures_util::{SinkExt, StreamExt, TryFutureExt};
use tokio::sync::{mpsc, RwLock};
use tokio_stream::wrappers::UnboundedReceiverStream;
use warp::ws::{Message, WebSocket};
use warp::Filter;

type Users = Arc<RwLock<HashMap<String, mpsc::UnboundedSender<Message>>>>;

#[derive(serde::Deserialize, serde::Serialize)]
#[serde(tag = "event")]
enum Event {
    #[serde(rename = "update-users")]
    UpdateUsers { usernames: Vec<String> },
    #[serde(rename = "send-message")]
    SendMessage { username: String, message: String },
}

#[tokio::main]
async fn main() {
    let users = Users::default();
    let users = warp::any().map(move || users.clone());

    let chat = warp::path("chat")
        .and(warp::query::<HashMap<String, String>>())
        .and(warp::ws())
        .and(users)
        .map(|q: HashMap<String, String>, ws: warp::ws::Ws, users| {
            let username = q.get("username").unwrap_or(&"test".to_string()).clone();

            // This will call our function if the handshake succeeds.
            ws.on_upgrade(move |socket| user_connected(socket, users, username))
        });

    warp::serve(chat).run(([127, 0, 0, 1], 8080)).await;
}

async fn user_connected(ws: WebSocket, users: Users, username: String) {
    eprintln!("New user connected: {}", username);

    let (mut user_ws_tx, mut user_ws_rx) = ws.split();
    let (tx, rx) = mpsc::unbounded_channel();

    let mut rx: UnboundedReceiverStream<Message> = UnboundedReceiverStream::new(rx);

    tokio::task::spawn(async move {
        while let Some(message) = rx.next().await {
            user_ws_tx
                .send(message)
                .unwrap_or_else(|e| {
                    eprintln!("websocket send error: {}", e);
                })
                .await;
        }
    });

    users.write().await.insert(username.clone(), tx);

    broadcast_usernames(&users).await;

    // Every time the user sends a message, broadcast it to all other users...
    while let Some(result) = user_ws_rx.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!("websocket error(uid={}): {}", username, e);
                break;
            }
        };

        user_message(username.clone(), msg, &users).await;
    }

    user_disconnected(username, &users).await;
}

async fn broadcast_usernames(users: &Users) {
    let usernames: Vec<String> = users.read().await.keys().cloned().collect();
    let msg = Event::UpdateUsers { usernames };
    let msg = serde_json::to_string(&msg).unwrap();

    println!("Sending updated username list to all clients...");
    for (_username, tx) in users.read().await.iter() {
        if let Err(_disconnected) = tx.send(Message::text(msg.clone())) {}
    }
}

async fn user_message(username: String, msg: Message, users: &Users) {
    let msg = if let Ok(s) = msg.to_str() {
        s
    } else {
        println!("Non-text message: {:?}", msg);
        return;
    };

    let new_msg = Event::SendMessage {
        username: username.clone(),
        message: msg.to_string(),
    };
    let new_msg = serde_json::to_string(&new_msg).unwrap();

    // New message from this user, send it to everyone...
    for (_username, tx) in users.read().await.iter() {
        if let Err(_disconnected) = tx.send(Message::text(new_msg.clone())) {}
    }
}

async fn user_disconnected(username: String, users: &Users) {
    println!("Client {} disconnected", username);

    users.write().await.remove(&username);

    broadcast_usernames(&users).await;
}
