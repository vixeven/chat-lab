interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return <div className="max-w-2xl mx-auto mt-8 border border-gray-100 rounded-md shadow-lg shadow-blue-50">{children}</div>;
};

export default Layout;
