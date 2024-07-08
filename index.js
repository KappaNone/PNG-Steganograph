import * as fs from "fs";
import { argv, exit } from "node:process";
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const imagePath = argv[2];
if (imagePath == undefined) {
    console.error("ERROR: No input file is provided");
    exit(1);
}
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
function isPng(buffer) {
    const bufSig = buffer.subarray(0, PNG_SIG.length);
    return bufSig.equals(PNG_SIG);
}
function getHeaderData(headerChunk) {
    return {
        width: headerChunk.data.readInt32BE(0),
        height: headerChunk.data.readInt32BE(4),
        bitDepth: headerChunk.data.readUInt8(8),
        colorType: headerChunk.data.readUInt8(9),
        compressionMethod: headerChunk.data.readUInt8(10),
        filterMethod: headerChunk.data.readUInt8(11),
        interlaceMethod: headerChunk.data.readUInt8(12)
    };
}
function getChunk(buffer, chunkStart) {
    const chunkSize = buffer.readInt32BE(chunkStart);
    const chunkEnd = chunkStart + 12 + chunkSize;
    const chunkType = buffer.subarray(chunkStart + 4, chunkStart + 8).toString('ascii');
    const chunkData = buffer.subarray(chunkStart + 8, chunkStart + 8 + chunkSize);
    const chunkCRC = buffer.subarray(chunkStart + 8 + chunkSize, chunkEnd);
    const chunk = {
        size: chunkSize,
        type: chunkType,
        data: chunkData,
        crc: Uint8Array.from(chunkCRC),
        end: chunkEnd
    };
    if (chunk.type == "IHDR") {
        return { ...chunk, data: getHeaderData(chunk) };
    }
    return chunk;
}
function getChunks(buffer) {
    const chunks = [];
    let chunk = getChunk(buffer, PNG_SIG.length);
    while (chunk.end != buffer.length) {
        chunks.push(chunk);
        chunk = getChunk(buffer, chunk.end);
    }
    chunks.push(chunk);
    return chunks;
}
const image = openPng(imagePath);
const chunks = getChunks(image);
for (let chunk of chunks) {
    console.log(chunk);
}
