declare namespace JSX {
  interface IntrinsicElements {
    'elevenlabs-convai': {
      'agent-id': string;
      'button-color'?: string;
      'button-position'?: 'bottom-right' | 'bottom-left';
      'initial-greeting'?: 'true' | 'false';
      'avatar-url'?: string;
      children?: React.ReactNode;
    };
  }
}
