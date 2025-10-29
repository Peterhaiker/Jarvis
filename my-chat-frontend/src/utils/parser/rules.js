import { StateType } from "./stateTypes";

export const parseRules = [
  { type: StateType.CODE_BLOCK, enter: /```|~~~/, exit: /```|~~~/ },
  { type: StateType.TABLE, enter: /^\|.*\|/, exit: /\n(?!\|)/ },
  { type: StateType.QUOTE, enter: /^>/, exit: /\n(?!>)/ },
  { type: StateType.FORMULA, enter: /^\$\$/, exit: /^\$\$/ },
  { type: StateType.CHART, enter: /^```mermaid/, exit: /^```/ },
];
