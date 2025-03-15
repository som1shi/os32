import { Link } from 'react-router-dom';
import '../App.css';

const HomePage = ({ games }) => {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Game Collection</h1>
        <p>Choose a game to play</p>
      </header>
      
      <div className="game-grid">
        {games.map(game => (
          <Link 
            key={game.id} 
            to={`/game/${game.id}`}
            className="game-card"
          >
            <div className="game-icon">{game.icon}</div>
            <h2 className="game-title">{game.title}</h2>
            <p className="game-description">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HomePage; 