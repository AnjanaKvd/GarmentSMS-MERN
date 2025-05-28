import Routes from './routes';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes />
    </ErrorBoundary>
  );
}

export default App;
