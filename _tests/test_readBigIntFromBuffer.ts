
import crypto from "crypto";

import {readBigIntFromBuffer, readBigIntFromBuffer2} from './readBigIntFromBuffer.ts'

// equality check + time spent
startCompare(2000);

//not the same buffers, only time spent
startBenchmark(readBigIntFromBuffer, readBigIntFromBuffer2, 2000)


function genRandomBuffer(){
    function randomInteger(min:number, max: number):number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    return Buffer.from(crypto.randomBytes(
        randomInteger(1, 1024)
    ));
}

function startCompare(iterations: number){

    let start = 0;
    const timer = (action:string) => {
        const time = performance.now()
        switch (action) {
            case 'start':
                start = time
                return 0
            case 'stop':
                const elapsed = time - start
                start = 0
                return elapsed
            default:
                return time - start
        }
    };
    let elapsed1=0, elapsed2=0;

    console.log('compare results old with new %o times', iterations);
    for(let i=0;i<iterations;++i){
        console.log(i, '\x1B[F')
        let buffer = genRandomBuffer();

        compareRes(buffer, false, false);
        compareRes(buffer, true,  false);
        compareRes(buffer, false, true);
        compareRes(buffer, true,  true);
    }
    console.log('✅All results are equivalent.')

    console.log(`old method
        Mean: ${elapsed1 / iterations}
        Exec. time: ${elapsed1}\n`
        +`new method
        Mean: ${elapsed2 / iterations}
        Exec. time: ${elapsed2}`
    )

    benchmarkRes(elapsed1, elapsed2);

    function compareRes(buffer: Buffer, little:boolean, signed=false){
        timer('start');
        let bi1 = readBigIntFromBuffer(buffer, little, signed);
        elapsed1+=timer('stop');
        timer('start');
        let bi2 = readBigIntFromBuffer2(buffer, little, signed);
        elapsed2+=timer('stop');

        let isEq = bi1.eq(bi2);

        if(!isEq) {
            //DBG
            console.log('❌BAD');
            console.log(little?'LE':'BE', signed?'Signed':'Unsigned');
            console.log('buf len=%o | bytesLeft=%o', buffer.length, buffer.length % 8);

            let strHex1 = bi1.toString(16);
            let strHex2 = bi2.toString(16);
            console.log(strHex1);
            console.log(strHex2);

            throw 'neq'
        }
    }
}


function benchmarkRes(e1:number, e2:number){
    const rate1 = e2/e1
    const rate2 = e1/e2
    const percent = Math.abs(1 - rate1)*100

    console.log(`[new] is ${(percent).toFixed(2)}% (x${rate2.toFixed(2)}) ${rate1 < 1 ? 'faster' : 'slower'} than [old]`)

}

function startBenchmark(f1:Function, f2:Function, iterations: number = 10_000){

    const getList = function(){
        let buf = genRandomBuffer();
        return [
            [buf, false, false],
            [buf, true,  false],
            [buf, false, true],
            [buf, true,  true],
        ]
    }

    const e1 = bench(f1, getList, iterations)
    const e2 = bench(f2, getList, iterations)

    benchmarkRes(e1, e2);


    /**
     * Figure out how long it takes for a method to execute.
     *
     * @param {Function} method to test
     * @param {Array} list of set of args to pass in.
     * @param {number} iterations number of executions.
     * @param {T} context the context to call the method in.
     * @return {number} the time it took, in milliseconds to execute.
     */
    function bench(method:Function, getList:()=>any[], iterations:number, context?:any) {
        let start = 0
        const timer = (action:string) => {
            const time = performance.now()
            switch (action) {
                case 'start':
                    start = time
                    return 0
                case 'stop':
                    const elapsed = time - start
                    start = 0
                    return elapsed
                default:
                    return time - start
            }
        };


        console.log('bench [%s] %o times', method.name, iterations);

        let elapsed=0;
        for (let i = 0; i < iterations; i++) {
            console.log(i, '\x1B[F') // adds time

            let list = getList()
            timer('start');
            for (const args of list) {
                method.apply(context, args)
            }
            elapsed += timer('stop')

        }


        console.log(`Called method [${method.name}]
        Mean: ${elapsed / iterations}
        Exec. time: ${elapsed}`)


        return elapsed
    }


}
