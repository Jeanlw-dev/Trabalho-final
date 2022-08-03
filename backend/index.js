const express = require('express')
const moment = require("moment")
const app = express()
const soap = require("soap")
const url = "http://desktop-fb9keo3:8088/mockParceiroAcomodacaoSOAP?WSDL"

const resultado = nomeCidade => {
    return new Promise((resolve) => {
        soap.createClient(url, (err, client) => {
            client.Buscar(function (err, result) {
                resolve(result.hotel.filter(p => p.endComercial.cidade === String(nomeCidade)))
            })
        })
    })
}

function conferirData(dataInicial, dataFinal) {
    const dataAtual = moment().format('L').split("/").reverse().join("-"),
        dataInicio = moment(dataInicial).format('L').split("/").reverse().join("-"),
        dataFinalizada = moment(dataFinal).format('L').split("/").reverse().join("-")
    if (dataInicio < dataAtual) return "Sua data inicial é menor que a data atual!"
    if (dataFinalizada < dataAtual) return "Sua data final é menor que a data atual!"
    if (dataInicio > dataFinalizada) return "Sua data inicial é maior que a data final!"
}

function formatoResultado(params, result) {
    let resultado = []
    if (params === "application/json") {
        result.forEach(element => {
            resultado.push({
                "hoteis": {
                    "hotel": {
                        "name": element.nome,
                        "endereco": element.endComercial.logradouro + ", " + element.endComercial.numero
                    }
                }
            })
        })
        return resultado
    } else if (params === "application/xml") {
        let xml = `<hotels>`

        result.forEach(element => {
            resultado.push(
                xml += `
                <hotel> 
                    <name>${element.nome}</name>
                    <endereco>${element.endComercial.logradouro + ", " + element.endComercial.numero}</endereco>
                </hotel>`
            )
        })

        xml += `</hotels>`
        return xml
    }
}

app.get('/hoteis', async (req, res) => {
    const { query, headers } = req
    let conferirDatas = conferirData(query.dataInicial, query.dataFinal)
    if (conferirDatas) return res.status(401).send(conferirData(query.dataInicial, query.dataFinal))
    resultado(query.cidade).then(result => {
        if (result.length === 0) return res.status(400).send("Nenhum dado encontrado")
        res.status(200).send(formatoResultado(headers.accept, result))
    })
})

app.listen(3000, (res) => {
    console.log('Server started on port : 5000')
})