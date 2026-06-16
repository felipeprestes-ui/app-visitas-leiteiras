$appPath  = 'C:\Users\prestesf\Projects\app-visitas-leiteiras\snack\App.js'
$histPath = 'C:\Users\prestesf\Projects\app-visitas-leiteiras\data\historico.js'

# Ler ambos os arquivos como arrays de linhas
$appLines  = [System.IO.File]::ReadAllLines($appPath,  [System.Text.Encoding]::UTF8)
$histLines = [System.IO.File]::ReadAllLines($histPath, [System.Text.Encoding]::UTF8)

# Encontrar a linha que tem "// NORMALIZACAO DO HISTORICO"
$insertIdx = -1
for ($i = 0; $i -lt $appLines.Count; $i++) {
    if ($appLines[$i] -match '// NORMALIZACAO DO HISTORICO') {
        # Inserir antes do comentario de linha separadora acima dessa linha
        # Procurar a linha de separacao "// ───" que vem antes
        $insertIdx = $i - 1  # linha com "// ───────..."
        # Recuar mais para incluir a linha vazia antes do separador
        if ($insertIdx -gt 0 -and $appLines[$insertIdx - 1].Trim() -eq '') {
            $insertIdx = $insertIdx - 1
        }
        break
    }
}

if ($insertIdx -eq -1) {
    Write-Host "ERROR: Could not find insertion point"
    exit 1
}

Write-Host "Inserting HISTORICO at line $($insertIdx + 1)"

# Construir o bloco de insercao
$insertBlock = @()
$insertBlock += ""
$insertBlock += "// -----------------------------------------"
$insertBlock += "// HISTORICO DE VISITAS (1473 registros, set/25-abr/26)"
$insertBlock += "// -----------------------------------------"
$insertBlock += ""
$insertBlock += $histLines
$insertBlock += ""

# Montar o arquivo final: parte antes + bloco + parte depois
$before = $appLines[0..($insertIdx - 1)]
$after  = $appLines[$insertIdx..($appLines.Count - 1)]

$final = $before + $insertBlock + $after

# Atualizar cabecalho: v7 -> v8
for ($i = 0; $i -lt [Math]::Min(5, $final.Count); $i++) {
    if ($final[$i] -match 'Expo Snack v7') {
        $final[$i] = $final[$i] -replace 'Expo Snack v7', 'Expo Snack v8'
    }
}

# Atualizar instrucoes de uso: substituir linhas "2 arquivos" por arquivo unico
for ($i = 0; $i -lt [Math]::Min(15, $final.Count); $i++) {
    if ($final[$i] -match '2 arquivos necessarios') {
        $final[$i] = ' * Como usar (arquivo unico):'
    }
    if ($final[$i] -match 'Crie o arquivo "data/historico.js"') {
        $final[$i] = ' * 2. Cole TODO este codigo no App.js'
    }
    if ($final[$i] -match 'No arquivo App.js, cole TODO este codigo') {
        $final[$i] = ' * 3. Salve (Ctrl+S)'
    }
    if ($final[$i] -match '^\ \*\ 4\. Salve') {
        $final[$i] = ' * 4. Clique em "My Device" e escaneie o QR Code com o Expo Go'
    }
    if ($final[$i] -match '^\ \*\ 5\. Clique') {
        $final[$i] = ' *'
    }
}

[System.IO.File]::WriteAllLines($appPath, $final, [System.Text.Encoding]::UTF8)

$lineCount = $final.Count
Write-Host "Done. Total lines: $lineCount"

# Verificacoes
$content = [System.IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)
if ($content -match "import HISTORICO from") { Write-Host "WARN: import still present" } else { Write-Host "OK: import removed" }
if ($content -match "const HISTORICO = \[")  { Write-Host "OK: const HISTORICO found" } else { Write-Host "ERROR: const HISTORICO missing" }
if ($content -match "HISTORICO_VISITS")       { Write-Host "OK: HISTORICO_VISITS found" } else { Write-Host "ERROR: HISTORICO_VISITS missing" }
if ($content -match "_mesToDate")             { Write-Host "OK: _mesToDate found"       } else { Write-Host "ERROR: _mesToDate missing" }
if ($content -match "Expo Snack v8")          { Write-Host "OK: v8 header"              } else { Write-Host "WARN: header not updated" }
