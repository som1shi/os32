# os32 - A Desktop in React.js!

A nostalgic Desktop experience with a collection of fun browser-based games and applications.

## Live Demo

Visit [os32.vercel.app](https://os32.vercel.app) to experience the os32 desktop interface, use the applications and play the games online. 

## Screenshots


## Features
- **Collection of games:**
  - **Refiner** (Severance-inspired sorting game)
    - Data refinement game inspired by the famous Apple TV show "Severance"
    - Sort numbers according to mysterious criteria
    - Multiple time-based challenges
  
  - **WikiConnect**
    - Navigate through Wikipedia to connect two random articles
    - History tracking of visited pages
    - Customizable games
  
  - **ColorMania**
    - Match colors in a fast-paced puzzle game
    - Fast moving animations
    - Dynamic responsiveness

  - **WordSweeper** (Minesweeper with a twist)
    - Classic Minesweeper gameplay with word puzzles
    - Timer and score tracking
    - Custom words suppport
  
  - **Schrödinger's Chess** (Quantum Chess)
    - Chess with quantum mechanics principles
    - Pieces exist in superposition until observed
    - Strategic gameplay with quantum uncertainty
  
  - **Rotate Connect Four**
    - Classic Connect Four with a rotating board mechanic
    - Play against AI or another player

   

- **Windows XP-inspired desktop interface**
  - Start menu with program shortcuts
  - Desktop icons for quick access
  - Taskbar with running applications
  - Resizable and draggable windows
  - Window minimizing, maximizing, and closing functionality
  - System tray with clock and indicators

- **Multiple built-in applications:**

  - **Terminal**
    - Full command-line interface
    - File system navigation and management
    - Launch applications from command line
    - Classic terminal appearance with dynamic 
    - Command history

  - **Code Editor** 
    - Code editor with Python and PyG support
    - Syntax highlighting for Python, PyG, and RISC-V assembly
    - Compile Python/PyG to RISC-V assembly
    - View and edit generated RISC-V code
    - Save and run compiled RISC-V programs
    - Integrated terminal interface via the Terminal app
    - Command support: `compile`, `asm`, and `run-riscv`
    - Basic simulator for RISC-V execution
    - Full RV32I base instruction set support

  - **File Explorer**
    - Browse and manage your documents
    - Create, rename, and delete files
    - Context menu with right-click options
    - Directory navigation
    - Integration with Notepad for text files and Code Editor for code files
  
  - **Notepad**
    - Create and edit text documents
    - Save and open functionality
    - Familiar text editing experience
  
  - **Internet Explorer**
    - Web browsing simulation
    - Bookmarks system
    - Search functionality
    - Tabs for multiple pages
  
  - **Music Player**
    - iPod-inspired interface
    - Play, pause, and skip controls
    - Utilizing Apple Music Preview API
    - Volume control
    - Background playback while using other applications

- **User Management System**
  - User profiles with avatars
  - Score history and statistics
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
- `python [file.py]` - Run Python file (e.g., `python script.py`)
- `pyg [file.pyg]` - Run PYG file (e.g., `pyg code.pyg`)
- `py2pyg [file.py]` - Convert Python to PYG (e.g., `py2pyg script.py`)
- `pyg2py [file.pyg]` - Convert PYG to Python (e.g., `pyg2py code.pyg`)
- `compile [file.py|file.pyg] [output.s]` - Compile Python/PyG to RISC-V (e.g., `compile hello.py hello.s`)
- `asm [file.s]` - Display assembly file content (e.g., `asm hello.s`)
- `run-riscv [file.s]` - Run RISC-V assembly code in simulator (e.g., `run-riscv hello.s`)



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
- PYG language: [PyGyat](https://github.com/shamith09/pygyat)
- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the tools and libraries used
