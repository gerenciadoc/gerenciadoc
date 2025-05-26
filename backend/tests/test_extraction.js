// Script para testar a extração automática de documentos
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configurações
const API_URL = 'http://localhost:5000';
const TEST_DOCS_DIR = path.join(__dirname, 'test_documents');
const RESULTS_DIR = path.join(__dirname, 'test_results');

// Criar diretório de resultados se não existir
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Função para testar upload e extração de um documento
async function testDocumentExtraction(filePath, userId, token) {
    try {
        const fileName = path.basename(filePath);
        console.log(`\nTestando extração para: ${fileName}`);
        
        // Criar FormData para upload
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        formData.append('name', `Teste - ${fileName}`);
        
        // Fazer upload do documento
        const response = await axios.post(
            `${API_URL}/api/documents/upload`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        // Salvar resultado
        const resultPath = path.join(RESULTS_DIR, `${path.parse(fileName).name}_result.json`);
        fs.writeFileSync(
            resultPath, 
            JSON.stringify({
                fileName,
                uploadSuccess: response.data.success,
                extractedData: response.data.extractedData,
                document: response.data.document,
                timestamp: new Date().toISOString()
            }, null, 2)
        );
        
        console.log(`✅ Extração concluída para ${fileName}`);
        console.log(`   Dados extraídos: ${Object.keys(response.data.extractedData || {}).length} campos`);
        
        return {
            fileName,
            success: response.data.success,
            extractedData: response.data.extractedData
        };
    } catch (error) {
        console.error(`❌ Erro ao testar ${path.basename(filePath)}:`, error.message);
        return {
            fileName: path.basename(filePath),
            success: false,
            error: error.message
        };
    }
}

// Função principal para testar todos os documentos
async function runTests() {
    try {
        // Login para obter token
        console.log('Fazendo login para obter token...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'admin@gerenciadoc.com',
            password: 'senha123'
        });
        
        const { token, user } = loginResponse.data;
        console.log(`Login bem-sucedido: ${user.name} (${user.email})`);
        
        // Listar arquivos de teste
        const files = fs.readdirSync(TEST_DOCS_DIR)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.pdf', '.docx', '.xlsx', '.jpg', '.png'].includes(ext);
            })
            .map(file => path.join(TEST_DOCS_DIR, file));
        
        console.log(`\nEncontrados ${files.length} documentos para teste`);
        
        // Testar cada arquivo
        const results = [];
        for (const file of files) {
            const result = await testDocumentExtraction(file, user.id, token);
            results.push(result);
        }
        
        // Gerar relatório final
        const successCount = results.filter(r => r.success).length;
        const extractionCount = results.filter(r => r.extractedData && Object.keys(r.extractedData).length > 0).length;
        
        const summaryPath = path.join(RESULTS_DIR, 'summary.json');
        fs.writeFileSync(
            summaryPath,
            JSON.stringify({
                totalTests: results.length,
                successfulUploads: successCount,
                successfulExtractions: extractionCount,
                extractionRate: `${Math.round((extractionCount / results.length) * 100)}%`,
                timestamp: new Date().toISOString(),
                results
            }, null, 2)
        );
        
        console.log('\n===== RESUMO DOS TESTES =====');
        console.log(`Total de documentos testados: ${results.length}`);
        console.log(`Uploads bem-sucedidos: ${successCount}`);
        console.log(`Extrações bem-sucedidas: ${extractionCount}`);
        console.log(`Taxa de extração: ${Math.round((extractionCount / results.length) * 100)}%`);
        console.log(`Relatório salvo em: ${summaryPath}`);
        
    } catch (error) {
        console.error('Erro ao executar testes:', error);
    }
}

// Executar testes
console.log('Iniciando testes de extração automática de documentos...');
runTests();
