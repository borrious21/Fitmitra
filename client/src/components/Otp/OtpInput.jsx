import { useState, useRef, useEffect } from "react";
import styles from "./OtpInput.module.css";

const OtpInput = ({ length = 6, value, onChange, disabled = false, error = false }) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (value !== undefined) {
      const otpArray = value.split("").slice(0, length);
      setOtp([...otpArray, ...Array(length - otpArray.length).fill("")]);
    }
  }, [value, length]);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (val.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, length);
    const newOtp = pasteData.split("");
    while (newOtp.length < length) newOtp.push("");
    setOtp(newOtp);
    onChange(newOtp.join(""));
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={styles.otpContainer}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`${styles.otpInput} ${error ? styles.otpInputError : ""}`}
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default OtpInput;