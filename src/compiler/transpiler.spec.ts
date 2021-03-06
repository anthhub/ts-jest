import { removeSync, writeFileSync } from 'fs-extra'

import { makeCompiler } from '../__helpers__/fakers'
import ProcessedSource from '../__helpers__/processed-source'
import { TS_JEST_OUT_DIR } from '../config/config-set'

describe('Transpiler', () => {
  const baseTsJestConfig = {
    isolatedModules: true,
  }

  it('should compile js file for allowJs true', () => {
    const fileName = `${__filename}.test.js`
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: { allowJs: true, outDir: TS_JEST_OUT_DIR } },
    })
    const source = 'export default 42'

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for jsx preserve', () => {
    const fileName = 'foo.tsx'
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: {
          jsx: 'preserve' as any,
        },
      },
    })
    const source = `
        const App = () => {
          return <>Test</>
        }
      `

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should compile tsx file for other jsx options', () => {
    const fileName = 'foo.tsx'
    const compiler = makeCompiler({
      tsJestConfig: {
        ...baseTsJestConfig,
        tsConfig: {
          jsx: 'react' as any,
        },
      },
    })
    const source = `
        const App = () => {
          return <>Test</>
        }
      `

    writeFileSync(fileName, source, 'utf8')
    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName)).toMatchSnapshot()

    removeSync(fileName)
  })

  it('should have correct source maps', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })
    const source = 'const f = (v: number) => v\nconst t: number = f(5)'
    const fileName = 'test-source-map-transpiler.ts'
    writeFileSync(fileName, source, 'utf8')

    const compiled = compiler.compile(source, fileName)

    expect(new ProcessedSource(compiled, fileName).outputSourceMaps).toMatchObject({
      file: fileName,
      sources: [fileName],
      sourcesContent: [source],
    })

    removeSync(fileName)
  })

  it('should not report diagnostics related to typings', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) => v
const t: string = f(5)
const v: boolean = t
`,
        'foo.ts',
      ),
    ).not.toThrowError()
  })

  it('should report diagnostics related to codes with pathRegex config is undefined', () => {
    const compiler = makeCompiler({ tsJestConfig: { ...baseTsJestConfig, tsConfig: false } })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) = v
const t: string = f(5)
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should report diagnostics related to codes with pathRegex config matches file name', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: 'foo.ts' } },
    })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) = v
const t: string = f(5)
`,
        'foo.ts',
      ),
    ).toThrowErrorMatchingSnapshot()
  })

  it('should not report diagnostics related to codes with pathRegex config does not match file name', () => {
    const compiler = makeCompiler({
      tsJestConfig: { ...baseTsJestConfig, tsConfig: false, diagnostics: { pathRegex: 'bar.ts' } },
    })

    expect(() =>
      compiler.compile(
        `
const f = (v: number) = v
const t: string = f(5)
`,
        'foo.ts',
      ),
    ).not.toThrowError()
  })
})
