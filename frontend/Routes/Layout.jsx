import Footer from "../src/components/Footer"; // Adjust the import path to your Footer component

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {children} {/* This will render your routes */}
      </main>
      <Footer /> {/* Footer will stick to the bottom */}
    </div>
  );
};

export default Layout;