import React from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { localizeChildren, localizeMixed } from '../utils/i18nText';

/**
 * Drop-in Text / TextInput for screens with legacy bilingual labels
 * ("हिंदी (English)"). Chooses the right half based on the app language.
 */
export const Text = React.forwardRef(function I18nText(props, ref) {
  const { language, t } = useLanguage();
  const { children, ...rest } = props;
  return (
    <RNText ref={ref} {...rest}>
      {localizeChildren(children, language, t)}
    </RNText>
  );
});

export const TextInput = React.forwardRef(function I18nTextInput(props, ref) {
  const { language, t } = useLanguage();
  const { placeholder, ...rest } = props;
  return (
    <RNTextInput
      ref={ref}
      placeholder={localizeMixed(placeholder, language, t)}
      {...rest}
    />
  );
});
