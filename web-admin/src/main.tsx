import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </BrowserRouter>,
);

