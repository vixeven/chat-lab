"use client";

import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Introduceți cel puțin 2 caractere",
  }),
});

interface Props {
  onSuccess: (username: string) => void;
}

export default function Login(props: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { username } = values;

    props.onSuccess(username);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-10">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nume de utilizator</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} autoComplete="nope" />
              </FormControl>
              <FormDescription>
                Numele de utilizator folosit pentru a te identifica în chat
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Autentificare</Button>
      </form>
    </Form>
  );
}
