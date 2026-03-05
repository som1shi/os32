import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaRegCircle,
  FaVolumeUp,
  FaVolumeMute,
} from 'react-icons/fa';

import paintIcon from '../assets/icons/paint.ico';
import calculatorIcon from '../assets/icons/calculator.png';
import minecraftIcon from '../assets/icons/minecraft.png';
import tetrisIcon from '../assets/icons/tetris.png';
import decryptIcon from '../assets/icons/decrypt.png';

// Custom PNG icons
import chessIcon from '../assets/icons/chess.png';
import codeEditorIcon from '../assets/icons/code_editor.png';
import colormanaIcon from '../assets/icons/colormania.png';
import computerIcon from '../assets/icons/computer.png';
import deleteIcon from '../assets/icons/delete.png';
import documentsIcon from '../assets/icons/documents.png';
import emulatorIcon from '../assets/icons/emulator.png';
import infoIcon from '../assets/icons/info.png';
import internetExplorerIcon from '../assets/icons/internet_explorer.png';
import leaderboardIcon from '../assets/icons/leaderboard.png';
import loginIcon from '../assets/icons/login.png';
import musicPlayerIcon from '../assets/icons/music_player.png';
import notepadIcon from '../assets/icons/notepad.png';
import pygFileIcon from '../assets/icons/pyg_file.png';
import refinerIcon from '../assets/icons/refiner.png';
import renameIcon from '../assets/icons/rename.png';
import rotateConnectFourIcon from '../assets/icons/rotate_connect_four.png';
import signOutIcon from '../assets/icons/sign_out.png';
import terminalIcon from '../assets/icons/terminal.png';
import wikiConnectIcon from '../assets/icons/wiki_connect.png';
import wordsweeperIcon from '../assets/icons/wordsweeper.png';

export const ICON_KEYS = {
  app: {
    documents: 'app.documents',
    notepad: 'app.notepad',
    terminal: 'app.terminal',
    codeEditor: 'app.codeEditor',
    internet: 'app.internet',
    music: 'app.music',
    profile: 'app.profile',
    about: 'app.about',
    leaderboard: 'app.leaderboard',
    pyg: 'app.pyg',
    rename: 'app.rename',
    delete: 'app.delete',
    paint: 'app.paint',
    calculator: 'app.calculator',
    minecraft: 'app.minecraft',
    soundOn: 'app.soundOn',
    soundOff: 'app.soundOff',
  },
  nav: {
    back: 'nav.back',
    forward: 'nav.forward',
    up: 'nav.up',
  },
  game: {
    wordsweeper: 'game.wordsweeper',
    quantumchess: 'game.quantumchess',
    rotateconnectfour: 'game.rotateconnectfour',
    refiner: 'game.refiner',
    wikiconnect: 'game.wikiconnect',
    colormania: 'game.colormania',
    dosemulator: 'game.dosemulator',
    doom: 'game.doom',
    chaostetris: 'game.chaostetris',
    decrypt: 'game.decrypt',
  },
  system: {
    signIn: 'system.signIn',
    signOut: 'system.signOut',
  },
  status: {
    online: 'status.online',
    offline: 'status.offline',
  },
};

export const iconRegistry = {
  // Apps
  [ICON_KEYS.app.documents]: documentsIcon,
  [ICON_KEYS.app.notepad]: notepadIcon,
  [ICON_KEYS.app.terminal]: terminalIcon,
  [ICON_KEYS.app.codeEditor]: codeEditorIcon,
  [ICON_KEYS.app.internet]: internetExplorerIcon,
  [ICON_KEYS.app.music]: musicPlayerIcon,
  [ICON_KEYS.app.profile]: computerIcon,
  [ICON_KEYS.app.about]: infoIcon,
  [ICON_KEYS.app.leaderboard]: leaderboardIcon,
  [ICON_KEYS.app.pyg]: pygFileIcon,
  [ICON_KEYS.app.rename]: renameIcon,
  [ICON_KEYS.app.delete]: deleteIcon,
  [ICON_KEYS.app.paint]: paintIcon,
  [ICON_KEYS.app.calculator]: calculatorIcon,
  [ICON_KEYS.app.minecraft]: minecraftIcon,
  [ICON_KEYS.app.soundOn]: FaVolumeUp,
  [ICON_KEYS.app.soundOff]: FaVolumeMute,

  // Nav
  [ICON_KEYS.nav.back]: FaArrowLeft,
  [ICON_KEYS.nav.forward]: FaArrowRight,
  [ICON_KEYS.nav.up]: FaArrowUp,

  // Games
  [ICON_KEYS.game.wordsweeper]: wordsweeperIcon,
  [ICON_KEYS.game.quantumchess]: chessIcon,
  [ICON_KEYS.game.rotateconnectfour]: rotateConnectFourIcon,
  [ICON_KEYS.game.refiner]: refinerIcon,
  [ICON_KEYS.game.wikiconnect]: wikiConnectIcon,
  [ICON_KEYS.game.colormania]: colormanaIcon,
  [ICON_KEYS.game.dosemulator]: emulatorIcon,
  [ICON_KEYS.game.doom]: emulatorIcon,
  [ICON_KEYS.game.chaostetris]: tetrisIcon,
  [ICON_KEYS.game.decrypt]: decryptIcon,

  // System
  [ICON_KEYS.system.signIn]: loginIcon,
  [ICON_KEYS.system.signOut]: signOutIcon,

  // Status
  [ICON_KEYS.status.online]: FaRegCircle,
  [ICON_KEYS.status.offline]: FaRegCircle,
};

export const getIconComponent = (name) => iconRegistry[name] || documentsIcon;
export const FALLBACK_ICON_KEY = ICON_KEYS.app.documents;
export const ICON_STATE_CLASS = {
  default: 'is-default',
  active: 'is-active',
  disabled: 'is-disabled',
  offline: 'is-offline',
};
