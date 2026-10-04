import bigInt from "big-integer";

/**
 * use hex strings
 * @param buffer
 * @param little
 * @param signed
 * @returns
 */
export function readBigIntFromBuffer(
    buffer: Buffer,
    little = true,
    signed = false
): bigInt.BigInteger {
    let randBuffer = Buffer.from(buffer);
    const bytesNumber = randBuffer.length;
    if (little) {
        randBuffer = randBuffer.reverse();
    }
    let bigIntVar = bigInt(randBuffer.toString("hex"), 16) as bigInt.BigInteger;

    if (signed && Math.floor(bigIntVar.toString(2).length / 8) >= bytesNumber) {
        bigIntVar = bigIntVar.subtract(bigInt(2).pow(bigInt(bytesNumber * 8)));
    }
    return bigIntVar;
}
/**
 * use bitint
 * @param buffer
 * @param little
 * @param signed
 * @returns
 */
export function readBigIntFromBuffer2(
    buffer: Buffer,
    little = true,
    signed = false
): bigInt.BigInteger {
    let count8b = buffer.length/8 | 0;
    let bytesLeft = buffer.length - count8b*8;

    // TODO use 0n after setting build target >= ES2020
    const bi64 = BigInt(64);
    let resBigInt = BigInt(0);
    let i = count8b;
    while(i>0){
        let bi = little ? buffer.readBigUInt64LE(buffer.length - (count8b-i+1)*8 )
                 /*BE*/ : buffer.readBigUint64BE((count8b-i)*8);
        resBigInt = bi + (resBigInt << bi64);

        --i;
    }

    const resBitLength = 8*buffer.length;

    // bytesLeft<8
    if(bytesLeft) {
        if(buffer.length<8){
            let buf8b = Buffer.allocUnsafe(8);
            let writeIdx = little ?
                  0
                : 8-bytesLeft;
            buffer.copy(buf8b, writeIdx, 0, bytesLeft);
            buffer = buf8b;
        }
        //read 64 bits and discard excess bits
        let bi = little ?
              buffer.readBigUInt64LE(0)
            : buffer.readBigUint64BE(buffer.length-8);
        bi = BigInt.asUintN(8*bytesLeft, bi); // discard higher bits - garbage
        resBigInt = bi + (resBigInt << BigInt(8*bytesLeft));
    }

    if(signed){
        resBigInt = BigInt.asIntN(resBitLength, resBigInt);
    }

    return bigInt(resBigInt);
}