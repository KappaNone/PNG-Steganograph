import * as fs from "fs";
import { exit } from "node:process";
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function openPng(path) {
    let imageBuf;
    try {
        imageBuf = fs.readFileSync(path);
    }
    catch {
        console.error(`ERROR: Could not open file ${path}`);
        exit(1);
    }
    if (!isPng(imageBuf)) {
        console.error("ERROR: Provided file is not PNG image");
        exit(1);
    }
    return imageBuf;
}
function writePng(fileName, buffer) {
    try {
        fs.writeFileSync(fileName, buffer);
    }
    catch (err) {
        console.error(`ERROR: Could not write file ${fileName}`);
        exit(1);
    }
}
function isPng(file) {
    const signature = Buffer.alloc(PNG_SIG.length);
    setBytes(file, signature, 0);
    return signature.equals(PNG_SIG);
}
function setBytes(file, buffer, offset) {
    const byteLength = Buffer.byteLength(buffer);
    const endPos = offset + byteLength;
    try {
        buffer.set(file.subarray(offset, endPos));
    }
    catch {
        console.error("ERROR: Failed to set bytes in the buffer");
        exit(1);
    }
    return endPos;
}
function getChunk(file, chunkStart) {
    const chunkSize = Buffer.alloc(4);
    const chunkSizeEnd = setBytes(file, chunkSize, chunkStart);
    const chunkType = Buffer.alloc(4);
    const chunkTypeEnd = setBytes(file, chunkType, chunkSizeEnd);
    const chunkData = Buffer.alloc(chunkSize.readInt32BE());
    const chunkDataEnd = setBytes(file, chunkData, chunkTypeEnd);
    const chunkCRC = Buffer.alloc(4);
    const chunkEnd = setBytes(file, chunkCRC, chunkDataEnd);
    const chunk = {
        size: chunkSize.readInt32BE(),
        type: chunkType.toString('ascii'),
        data: chunkData,
        crc: chunkCRC
    };
    return [chunk, chunkEnd];
}
function getChunks(file) {
    const chunks = [];
    let [chunk, chunkEnd] = getChunk(file, PNG_SIG.length);
    let done = false;
    while (!done) {
        chunks.push(chunk);
        if (chunk.type === "IEND")
            done = true;
        [chunk, chunkEnd] = getChunk(file, chunkEnd);
    }
    return chunks;
}
function chunkToBuffer(chunk) {
    const chunkSize = Buffer.alloc(4);
    const chunkType = Buffer.alloc(4);
    chunkSize.writeInt32BE(chunk.size);
    chunkType.write(chunk.type);
    return Buffer.concat([chunkSize, chunkType, chunk.data, chunk.crc]);
}
function chunksToBuffer(chunks) {
    const buffers = [PNG_SIG];
    for (let chunk of chunks) {
        buffers.push(chunkToBuffer(chunk));
    }
    return Buffer.concat(buffers);
}
function deleteSecretChunks(chunks) {
    const secretChunkIndex = chunks.findIndex(chunk => chunk.type == "scRT");
    if (secretChunkIndex != -1) {
        try {
            chunks.splice(secretChunkIndex, 1);
        }
        catch {
            console.error("ERROR: Cannot delete an existing secret chunk");
            exit(1);
        }
    }
}
function putSecretChunk(chunks, secretMsg) {
    deleteSecretChunks(chunks);
    const secretMsgBuffer = Buffer.from(secretMsg);
    const secretChunk = {
        size: Buffer.byteLength(secretMsgBuffer),
        type: "scRT",
        data: secretMsgBuffer,
        crc: Buffer.alloc(4)
    };
    try {
        chunks.splice(chunks.length - 1, 0, secretChunk);
    }
    catch {
        console.error("ERROR: Cannot add a new secret chunk");
        exit(1);
    }
}
function getSecretChunk(chunks) {
    const secretChunkIndex = chunks.findIndex(chunk => chunk.type == "scRT");
    if (secretChunkIndex != -1) {
        return chunks[secretChunkIndex];
    }
    else {
        return null;
    }
}
const image = openPng("output2.png");
const chunks = getChunks(image);
//* Put secret message into the image
// putSecretChunk(chunks, "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.");
// const outputBuffer = chunksToBuffer(chunks);
// writePng("output2.png", outputBuffer);
//* Get secret message from the image
const secretChunk = getSecretChunk(chunks);
if (secretChunk == null) {
    console.log("No secret message found");
    exit(0);
}
;
console.info(`Secret message: ${secretChunk.data.toString()}`);
//TODO: Create a convenient CLI
