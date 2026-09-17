const getVersionInfo = async (req, res) => {
  try {
    // Fetch app name and version from process.env
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "CRM";
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "3.0.1";

    // Exact response structure requested by user
    const response = {
      file_name: appName,
      version: appVersion
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Error",
      message: error.message 
    });
  }
};

module.exports = {
  getVersionInfo
};
