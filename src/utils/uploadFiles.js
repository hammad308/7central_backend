const path = require('path');
const fsPromises = require('node:fs/promises');
const fs = require('fs');

// ==================== Helper: Get file extension from base64 ====================
async function getFileExtension(base64String) {
  const buffer = Buffer.from(base64String, 'base64');
  const { fileTypeFromBuffer } = await import('file-type');
  const fileInfo = await fileTypeFromBuffer(buffer);

  if (!fileInfo) {
    throw new Error('Unable to determine file type from base64 data');
  }

  return fileInfo.ext; // No leading dot: "pdf", "jpg", "png"
}

// ==================== Upload Data File (PDF, DOC, XLS, etc.) ====================
const uploadDataFile = async (base64String, directoryName, clientFileNameIncludingExtension) => {
  try {
    const uploadDir = path.join(__dirname, '..', 'uploads', directoryName);

    // Create directory if not exists (async)
    if (!fs.existsSync(uploadDir)) {
      await fsPromises.mkdir(uploadDir, { recursive: true });
    }

    const randomPrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    
    let fileNameOnServerDisk;
    if (clientFileNameIncludingExtension) {
      // Added separator between prefix and original name
      fileNameOnServerDisk = `${randomPrefix}-${clientFileNameIncludingExtension}`;
    } else {
      // Detect extension from base64 if client name not provided
      const ext = await getFileExtension(base64String);
      fileNameOnServerDisk = `${randomPrefix}.${ext}`;
    }

    const filePath = path.join(uploadDir, fileNameOnServerDisk);

    // Async write
    await fsPromises.writeFile(filePath, base64String, 'base64');

    return fileNameOnServerDisk;
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// ==================== Delete Data File ====================
const deleteDataFile = async (directoryName, fileNameOnServerDisk) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', directoryName, fileNameOnServerDisk);

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
      return true;
    } else {
      console.warn(`File not found for deletion: ${filePath}`);
      return false; // File already gone, not an error
    }
  } catch (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

// ==================== Upload Base64 Image (JPG, PNG, WebP, etc.) ====================
const uploadBase64Image = async (base64String, uploadDirPath) => {
  try {
    const buffer = Buffer.from(base64String, 'base64');

    // Detect file type
    const { fileTypeFromBuffer } = await import('file-type');
    const fileInfo = await fileTypeFromBuffer(buffer);

    if (!fileInfo) {
      throw new Error('Invalid or unsupported image type');
    }

    // Ensure directory exists (async)
    const fullDirPath = path.join(__dirname, '..', uploadDirPath);
    if (!fs.existsSync(fullDirPath)) {
      await fsPromises.mkdir(fullDirPath, { recursive: true });
    }

    // Generate unique file name
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e12)}.${fileInfo.ext}`;
    const filePath = path.join(fullDirPath, fileName);

    // Async write (no blocking)
    await fsPromises.writeFile(filePath, buffer);

    return {
      fileName,
      filePath,
      ext: fileInfo.ext,
      mime: fileInfo.mime,
    };
  } catch (error) {
    console.error('Image Upload Error:', error);
    throw error;
  }
};

module.exports = {
  uploadDataFile,
  deleteDataFile,
  getFileExtension,
  uploadBase64Image,
};