# Windows XP Games Collection

A collection of browser-based games with a Windows XP-style interface. Play classic games with a nostalgic twist!

## Live Demo

Visit [os32.vercel.app](https://os32.vercel.app) to play the games online.

## Features

- Windows XP-style desktop interface
- Multiple games to play:
  - WordSweeper (Minesweeper with a twist)
  - Schrödinger's Chess (Quantum Chess)
  - Rotate Connect Four
  - Macrodata Refinement (Severance-inspired game)
  - WikiConnect (Wikipedia navigation game)
- User authentication with Google
- Leaderboards for each game
- User profiles with score history

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/windows-xp-games.git
   cd windows-xp-games
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication with Google provider
   - Create a Firestore database
   - Set up the following Firestore collections:
     - `users`: To store user information
     - `scores`: To store game scores

4. Configure Firebase in your project:
   - Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
   - Update the `src/firebase/config.js` file with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
     authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
     storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
     appId: process.env.REACT_APP_FIREBASE_APP_ID
   };
   ```

5. Start the development server:
   ```
   npm start
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ as a nostalgic tribute to Windows XP
