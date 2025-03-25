# OS32 - A Desktop in React.js!

A nostalgic Windows XP-style desktop experience with a collection of fun browser-based games. Relive the classic desktop feel while enjoying modern games in this faithful recreation of the iconic Windows XP interface.

## Live Demo

Visit [os32.vercel.app](https://os32.vercel.app) to experience the OS32 desktop interface and play games online. 

## Screenshots


## Features

- **Authentic Windows XP-style desktop interface**
  - Start menu with program shortcuts
  - Desktop icons for quick access
  - Taskbar with running applications
  - Resizable and draggable windows
  - Window minimizing, maximizing, and closing functionality
  - System tray with clock and indicators

- **Multiple built-in applications:**
  - **File Explorer**
    - Browse and manage your documents
    - Create, rename, and delete files
    - Context menu with right-click options
    - Directory navigation
    - Integration with Notepad for text files
  
  - **Notepad**
    - Create and edit text documents
    - Save and open functionality
    - Auto-save feature
    - Familiar text editing experience
  
  - **Terminal**
    - Full command-line interface
    - File system navigation and management
    - Launch applications from command line
    - Classic terminal appearance with green text on black background
    - Command history
  
  - **Internet Explorer**
    - Web browsing simulation
    - Bookmarks system
    - Search functionality
    - Tabs for multiple pages
  
  - **Music Player**
    - iPod-inspired interface
    - Play, pause, and skip controls
    - Playlist management
    - Volume control
    - Background playback while using other applications

- **Collection of games:**
  - **WordSweeper** (Minesweeper with a twist)
    - Classic Minesweeper gameplay with word puzzles
    - Multiple difficulty levels
    - Timer and score tracking
    - Customizable grid sizes
  
  - **Schrödinger's Chess** (Quantum Chess)
    - Chess with quantum mechanics principles
    - Pieces exist in superposition until observed
    - Strategic gameplay with quantum uncertainty
    - Tutorial mode for beginners
  
  - **Rotate Connect Four**
    - Classic Connect Four with a rotating board mechanic
    - Play against AI or another player
    - Multiple difficulty levels
    - Special power-ups and game modes
  
  - **Refiner** (Severance-inspired sorting game)
    - Data refinement game inspired by the TV show "Severance"
    - Sort numbers according to mysterious criteria
    - Multiple time-based challenges
    - Progressive difficulty levels
  
  - **WikiConnect**
    - Navigate through Wikipedia to connect two random articles
    - Challenge mode with time limits
    - History tracking of visited pages
    - Customizable difficulty settings
  
  - **ColorMania**
    - Match colors in a fast-paced puzzle game
    - Multiple game modes
    - Special power-ups and challenges
    - Leaderboards for each mode

- **User Management System**
  - User profiles with avatars
  - Score history and statistics
  - Achievements and badges
  - Authentication with multiple providers

- **File System**
  - Storage for user-created text files
  - Persistent across sessions
  - Folder organization
  - Integration with desktop applications

- **Global leaderboards for each game**
  - Real-time score updates
  - Filter by time period (daily, weekly, all-time)
  - Friend comparison
  - Personal best tracking

## Terminal Features

The terminal app provides a powerful command-line interface with several useful commands:

- `help` - Show available commands and their usage
- `cd [directory]` - Change directory (e.g., `cd Documents`, `cd Desktop`, `cd ..`)
- `ls` - List files and directories in the current location
- `pwd` - Print working directory (shows your current location)
- `echo [text]` - Display text in the terminal (e.g., `echo Hello World`)
- `clear` - Clear terminal screen and command history
- `touch [name]` - Create a new text file (e.g., `touch notes.txt`)
- `cat [file]` - Display file contents (e.g., `cat notes.txt`)
- `rm [file]` - Remove a file (e.g., `rm notes.txt`)
- `date` - Display current date and time
- `whoami` - Display current user information
- `exec [app]` - Launch an application (e.g., `exec Notepad.app`, `exec MusicPlayer.app`)


## System Requirements

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection for online features
- No installation required - runs entirely in browser

## Setup Instructions (Development)

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/os32.git
   cd os32
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Building for Production

```
npm run build
```

This will create an optimized production build in the `dist` directory, ready for deployment to any static hosting service.

## Deployment

OS32 can be deployed to any static site hosting service:

1. Build the project using `npm run build`
2. Upload the contents of the `dist` directory to your hosting provider
3. Configure your domain and settings as needed

## Technology Stack

- React.js - UI framework
- React Router - Navigation
- CSS3 - Styling and animations
- Vercel - Hosting and deployment
- Firebase - Backend and authentication (optional)

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please make sure to update tests as appropriate and follow the code style guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by Microsoft Windows XP
- [Miracode](https://github.com/IdreesInc/Miracode) font by IdreesInc used in the Terminal application
- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the tools and libraries used
