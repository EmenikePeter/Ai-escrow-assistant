const processColorObject = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('PlatformColorValueTypes.processColorObject is not supported on web.');
  }
  return null;
};

module.exports = {
  processColorObject,
};
