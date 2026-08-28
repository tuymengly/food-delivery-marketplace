import React from 'react';
import Typewriter from 'typewriter-effect';
import { useTranslation } from 'react-i18next';

const TypeAnimation = () => {
  const { t, i18n } = useTranslation();
  const isKhmer = i18n.language === "kh";

  return (
<h1 className={`text-5xl lg:text-7xl pb-5 font-bold bg-white bg-clip-text text-transparent ${isKhmer ? '' : 'uppercase'}`}>
      <Typewriter
        key={i18n.language}
        options={{ loop: true, delay: 75 }}
        onInit={(typewriter) => {
          typewriter
            .typeString(t("typeAnimation.text1"))
            .pauseFor(1500)
            .deleteAll()
            .typeString(t("typeAnimation.text2"))
            .pauseFor(1500)
            .start();
        }}
      />
    </h1>
  );
};

export default TypeAnimation;
