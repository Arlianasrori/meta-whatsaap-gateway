
export const addImageFile = async (file,imageUrl) => {
    const nameFile = new Date().getTime() + "-" + file.name
    imageUrl = imageUrl + nameFile
    await file.mv(`./public/images/${nameFile}`)
    return imageUrl
}

export const addDocumentFile = async (file,documentUrl) => {
    const nameFile = new Date().getTime() + "-" + file.name
    documentUrl = documentUrl + nameFile
    await file.mv(`./public/documents/${nameFile}`)
    return documentUrl
}