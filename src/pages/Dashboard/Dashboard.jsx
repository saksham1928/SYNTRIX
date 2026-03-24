import AutoControlledVideo from '../../components/AutoControlledVideo/AutoControlledVideo';

function Dashboard() {
  return (
    // The Dashboard component handles the full-screen layout and background
    <div className="min-vh-100 bg-dark text-light d-flex flex-column">

      {/*The Main Content Area (Video & Webcam) */}
      <main className="flex-grow-1">
        <AutoControlledVideo />
      </main>
      
    </div>
  );
}

export default Dashboard;