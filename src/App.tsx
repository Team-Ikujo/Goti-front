import "./styles/globals.css";
import { QueryProvider } from "@/app/providers/query";
import { AppRouter } from "@/app/providers/router";

const App = () => {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  );
};

export default App;
