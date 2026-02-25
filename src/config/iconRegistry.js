import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUp,
  FaChessKnight,
  FaCode,
  FaDoorOpen,
  FaFire,
  FaFolder,
  FaFolderOpen,
  FaGlobeAmericas,
  FaInfoCircle,
  FaKey,
  FaLink,
  FaMusic,
  FaPencilAlt,
  FaRegCircle,
  FaRegUser,
  FaTrash,
} from 'react-icons/fa';
import { LuBomb, LuDice5, LuTerminal } from 'react-icons/lu';
import { MdOutlineColorLens, MdOutlineGridOn, MdOutlineLeaderboard } from 'react-icons/md';
import { PiNotebookFill } from 'react-icons/pi';

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
  [ICON_KEYS.app.documents]: FaFolder,
  [ICON_KEYS.app.notepad]: PiNotebookFill,
  [ICON_KEYS.app.terminal]: LuTerminal,
  [ICON_KEYS.app.codeEditor]: FaCode,
  [ICON_KEYS.app.internet]: FaGlobeAmericas,
  [ICON_KEYS.app.music]: FaMusic,
  [ICON_KEYS.app.profile]: FaRegUser,
  [ICON_KEYS.app.about]: FaInfoCircle,
  [ICON_KEYS.app.leaderboard]: MdOutlineLeaderboard,
  [ICON_KEYS.app.pyg]: FaFire,
  [ICON_KEYS.app.rename]: FaPencilAlt,
  [ICON_KEYS.app.delete]: FaTrash,

  [ICON_KEYS.nav.back]: FaArrowLeft,
  [ICON_KEYS.nav.forward]: FaArrowRight,
  [ICON_KEYS.nav.up]: FaArrowUp,

  [ICON_KEYS.game.wordsweeper]: LuBomb,
  [ICON_KEYS.game.quantumchess]: FaChessKnight,
  [ICON_KEYS.game.rotateconnectfour]: LuDice5,
  [ICON_KEYS.game.refiner]: MdOutlineGridOn,
  [ICON_KEYS.game.wikiconnect]: FaLink,
  [ICON_KEYS.game.colormania]: MdOutlineColorLens,

  [ICON_KEYS.system.signIn]: FaKey,
  [ICON_KEYS.system.signOut]: FaDoorOpen,

  [ICON_KEYS.status.online]: FaRegCircle,
  [ICON_KEYS.status.offline]: FaRegCircle,
};

export const getIconComponent = (name) => iconRegistry[name] || FaFolderOpen;
export const FALLBACK_ICON_KEY = ICON_KEYS.app.documents;
export const ICON_STATE_CLASS = {
  default: 'is-default',
  active: 'is-active',
  disabled: 'is-disabled',
  offline: 'is-offline',
};
