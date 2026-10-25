param(
    [string]$XmlPath = ".\scripts\sample-generated-di.xml"
)

$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

$settings = New-Object System.Xml.XmlReaderSettings
$settings.ValidationType = [System.Xml.ValidationType]::Schema
$settings.ValidationFlags = [System.Xml.Schema.XmlSchemaValidationFlags]::ProcessInlineSchema -bor `
                           [System.Xml.Schema.XmlSchemaValidationFlags]::ProcessSchemaLocation -bor `
                           [System.Xml.Schema.XmlSchemaValidationFlags]::ReportValidationWarnings

$schemaSet = New-Object System.Xml.Schema.XmlSchemaSet
$schemaSet.XmlResolver = New-Object System.Xml.XmlUrlResolver

$commonXsd = (Resolve-Path ".\src\services\e3l-common.xsd").Path
$wassupXsd = (Resolve-Path ".\src\services\e3l-wasteSupport.xsd").Path
$wasteXsd  = (Resolve-Path ".\src\services\e3l-standalone-dcs.xsd").Path

$schemaSet.Add("e3l://eterproject.org/3.0/common", $commonXsd) | Out-Null
$schemaSet.Add("e3l://eterproject.org/3.0/wasteSupport", $wassupXsd) | Out-Null
$schemaSet.Add($null, $wasteXsd) | Out-Null
$schemaSet.Compile()
$settings.Schemas = $schemaSet

$validationEventHandler = [System.Xml.Schema.ValidationEventHandler]{
    param($sender, $e)
    if ($e.Severity -eq [System.Xml.Schema.XmlSeverityType]::Warning) {
        $warnings.Add("WARN [Línea $($e.Exception.LineNumber), Pos $($e.Exception.LinePosition)]: $($e.Message)")
    } else {
        $errors.Add("ERROR [Línea $($e.Exception.LineNumber), Pos $($e.Exception.LinePosition)]: $($e.Message)")
    }
}

$settings.add_ValidationEventHandler($validationEventHandler)

Write-Host "Validando XML contra esquemas E3L oficiales (MITECO / SIRA)..." -ForegroundColor Cyan
Write-Host "Archivo XML: $XmlPath"
Write-Host "--------------------------------------------------------"

try {
    $resolvedXml = (Resolve-Path $XmlPath).Path
    $reader = [System.Xml.XmlReader]::Create($resolvedXml, $settings)
    while ($reader.Read()) { }
    $reader.Close()

    if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
        Write-Host "✅ CUMPLIMIENTO TOTAL: El XML es 100% válido contra el esquema oficial E3L" -ForegroundColor Green
    } else {
        if ($warnings.Count -gt 0) {
            Write-Host "`n⚠️ Advertencias ($($warnings.Count)):" -ForegroundColor Yellow
            $warnings | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        }
        if ($errors.Count -gt 0) {
            Write-Host "`n❌ Errores encontrados ($($errors.Count)):" -ForegroundColor Red
            $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        }
    }
} catch {
    Write-Host "Excepción durante la validación: $($_.Exception.Message)" -ForegroundColor Red
}
