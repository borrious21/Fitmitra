import React from 'react';
import styles from './BackgroundVideo.module.css';

const BackgroundVideo = ({ src = "/videos/auth_bg.mp4", opacity = 0.4 }) => {
  return (
    <>
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className={styles.bgVideo}
        style={{ opacity }}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className={styles.videoOverlay} />
    </>
  );
};

export default BackgroundVideo;
