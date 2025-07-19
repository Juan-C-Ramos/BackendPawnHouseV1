const { google } = require('googleapis');
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, './backendlirdocoments-be0e57b86b12.json'), // Ruta a tu archivo de cuenta de servicio
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

const uploadToDrive = async (filePath, fileName, folderId) => {
  const mimeType = mime.lookup(filePath);

  const fileMetadata = {
    name: fileName,
    parents: [folderId], // Carpeta compartida o unidad compartida
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, webViewLink',
    supportsAllDrives: true,  // Muy importante para shared drives y carpetas compartidas
  });

  return response.data;
};

module.exports = uploadToDrive;
