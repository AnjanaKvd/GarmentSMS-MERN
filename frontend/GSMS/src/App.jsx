import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Routes from './routes';
import ErrorBoundary from './components/ErrorBoundary';
import { getCurrentUser } from './redux/slices/authSlice';
import { NotificationProvider } from './components/common/Notification';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for token and get user data on app load
    dispatch(getCurrentUser());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Routes />
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
