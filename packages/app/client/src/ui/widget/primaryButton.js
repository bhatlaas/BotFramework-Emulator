import React from 'react';
import { css } from 'glamor';

import * as Colors from '../styles/colors';
import * as Fonts from '../styles/fonts';

const CSS = css({
  backgroundColor: Colors.C10,
  color: Colors.C4,
  fontFamily: Fonts.FONT_FAMILY_DEFAULT,
  border: 0,
  padding: '8px 12px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  display: 'inline-block',
  width: 'auto',
  minWidth: '120px',

  '&:hover': {
    backgroundColor: Colors.C11
  },

  '&:focus': {
    backgroundColor: Colors.C11
  },

  '&:active': {
    backgroundColor: Colors.C12
  },

  '&:disabled': {
    backgroundColor: Colors.C2,
    color: Colors.C22,
    cursor: 'default'
  }
});

// TODO: Move to packages/ui-react unless we start using Fabric
export default props => {
  const buttonClass = props.buttonClass ? ` ${props.buttonClass}` : '';
  return <button className={ CSS + buttonClass } onClick={ props.onClick } disabled={ props.disabled }>{ props.text }</button>;
}
