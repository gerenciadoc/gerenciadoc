// Script para gerar documentos de teste a partir dos exemplos
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const docx = require('docx');
const ExcelJS = require('exceljs');
const examples = require('./document_examples');

// Diretório para salvar os documentos de teste
const TEST_DOCS_DIR = path.join(__dirname, '../test_documents');

// Garantir que o diretório existe
if (!fs.existsSync(TEST_DOCS_DIR)) {
    fs.mkdirSync(TEST_DOCS_DIR, { recursive: true });
}

// Função para criar um documento PDF
async function createPDF(content, filename) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const lines = content.split('\n');
    let y = 800; // Posição inicial do texto
    
    for (const line of lines) {
        if (line.trim() !== '') {
            page.drawText(line, {
                x: 50,
                y,
                size: 10,
                font,
                color: rgb(0, 0, 0),
            });
        }
        y -= 12; // Espaçamento entre linhas
        
        // Se chegou ao final da página, criar uma nova
        if (y < 50) {
            y = 800;
            page.addPage([595.28, 841.89]);
        }
    }
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(path.join(TEST_DOCS_DIR, filename), pdfBytes);
    console.log(`PDF criado: ${filename}`);
}

// Função para criar um documento DOCX
async function createDOCX(content, filename) {
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: content,
                        }),
                    ],
                }),
            ],
        }],
    });
    
    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(path.join(TEST_DOCS_DIR, filename), buffer);
    console.log(`DOCX criado: ${filename}`);
}

// Função para criar uma planilha Excel
async function createXLSX(content, filename) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Planilha1');
    
    // Dividir o conteúdo em linhas
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    // Processar cada linha
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Se a linha contém separadores de coluna
        if (line.includes('|')) {
            const cells = line.split('|').map(cell => cell.trim());
            worksheet.addRow(cells);
        } else {
            // Linha sem separadores, adicionar como uma única célula
            worksheet.addRow([line]);
        }
    }
    
    await workbook.xlsx.writeFile(path.join(TEST_DOCS_DIR, filename));
    console.log(`XLSX criado: ${filename}`);
}

// Criar os documentos de teste
async function createTestDocuments() {
    try {
        // Criar PDFs
        await createPDF(examples.certidaoNegativaDebitos, 'certidao_negativa.pdf');
        await createPDF(examples.atestadoCapacidadeTecnica, 'atestado_capacidade.pdf');
        
        // Criar DOCXs
        await createDOCX(examples.propostaTecnica, 'proposta_tecnica.docx');
        await createDOCX(examples.detalhamentoBDI, 'detalhamento_bdi.docx');
        
        // Criar XLSXs
        await createXLSX(examples.planilhaOrcamento, 'planilha_orcamento.xlsx');
        await createXLSX(examples.cronogramaFisicoFinanceiro, 'cronograma.xlsx');
        
        console.log('Todos os documentos de teste foram criados com sucesso!');
    } catch (error) {
        console.error('Erro ao criar documentos de teste:', error);
    }
}

// Executar a criação dos documentos
createTestDocuments();
