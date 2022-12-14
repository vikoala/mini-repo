import fs from 'fs'
import path from 'path'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import ejs from 'ejs'
import { transformFromAst } from 'babel-core'

let id = 0

function createAsset(filePath) {
    // 1. 获取文件内容
    const source = fs.readFileSync(filePath, { encoding: 'utf-8' })

    // 2. 获取依赖关系
    const ast = parser.parse(source, { sourceType: "module" })
    const deps = []
    traverse.default(ast, {
        ImportDeclaration({ node }) {
            deps.push(node.source.value)
        }
    })
    // 转换
    const { code } = transformFromAst(ast, null, { presets: ['env'] })
    return {
        filePath,
        // 当前文件的代码
        code,
        // 当前文件的依赖
        deps,
        mapping: {},
        id: id++
    }
}

function createGraph() {
    const mainAsset = createAsset('./example/main.js')

    const queue = [mainAsset]

    for (const asset of queue) {
        asset.deps.forEach((relativePath) => {
            const child = createAsset(path.resolve(`./example`, relativePath))
            asset.mapping[relativePath] = child.id
            queue.push(child)
        })
    }
    return queue
}

const graph = createGraph()

function build(graph) {
    const template = fs.readFileSync("./bundle.ejs", { encoding: "utf-8" })
    const data = graph.map(asset => {
        const { id, code, mapping } = asset
        return {
            id,
            code,
            mapping
        }
    })
    const code = ejs.render(template, { data })
    fs.writeFileSync("./dist/bundle.js", code)
}

build(graph)