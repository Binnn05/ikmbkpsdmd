import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
      <div className="widget-container">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
  );
};

export default MainLayout;