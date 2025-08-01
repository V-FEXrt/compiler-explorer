// Copyright (c) 2017, Najjar Chedy
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import * as fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import {describe, expect, it} from 'vitest';

import {generateStructure} from '../lib/cfg/cfg.js';

import {CompilerInfo} from '../types/compiler.interfaces.js';
import {makeFakeCompilerInfo, resolvePathFromTestRoot} from './utils.js';

async function DoCfgTest(cfgArg, filename, isLlvmIr = false, compilerInfo?: CompilerInfo) {
    const contents = JSON.parse(await fs.readFile(filename, 'utf8'));
    if (!compilerInfo) {
        compilerInfo = makeFakeCompilerInfo({
            compilerType: '',
            version: cfgArg,
        });
    }
    const structure = await generateStructure(compilerInfo, contents.asm, isLlvmIr);
    expect(structure).toEqual(contents.cfg);
}

describe('Cfg test cases', () => {
    const testcasespath = resolvePathFromTestRoot('cfg-cases');

    // For backwards compatability reasons, we have a sync readdir here. For details, see
    // the git blame of this file.
    // TODO: Consider replacing with https://github.com/vitest-dev/vitest/issues/703
    const files = fsSync.readdirSync(testcasespath);

    describe('gcc', () => {
        for (const filename of files.filter(x => x.includes('gcc'))) {
            it(filename, async () => {
                await DoCfgTest('g++', path.join(testcasespath, filename));
            });
        }
    });

    describe('clang', () => {
        for (const filename of files.filter(x => x.includes('clang'))) {
            it(filename, async () => {
                await DoCfgTest('clang', path.join(testcasespath, filename));
            });
        }
    });

    describe('llvmir', () => {
        for (const filename of files.filter(x => x.includes('llvmir'))) {
            it(filename, async () => {
                await DoCfgTest('clang', path.join(testcasespath, filename), true);
            });
        }
    });

    describe('python', () => {
        const pythonCompilerInfo = makeFakeCompilerInfo({
            instructionSet: 'python',
            group: 'python3',
            version: 'Python 3.12.1',
            compilerType: 'python',
        });

        for (const filename of files.filter(x => x.includes('python'))) {
            it(filename, async () => {
                await DoCfgTest('python', path.join(testcasespath, filename), false, pythonCompilerInfo);
            });
        }
    });
});
