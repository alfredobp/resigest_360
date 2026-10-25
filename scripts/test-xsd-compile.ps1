$schemaSet = New-Object System.Xml.Schema.XmlSchemaSet
try {
    $schemaPath = (Resolve-Path '.\discover\xml files\e3l.xsd').Path
    $schemaSet.Add('e3l://eterproject.org/3.0/e3l', $schemaPath) | Out-Null
    $schemaSet.Compile()
    Write-Output "Global elements in e3l.xsd: $($schemaSet.GlobalElements.Count)"
    foreach ($elem in $schemaSet.GlobalElements.Values) {
        Write-Output "Element: $($elem.QualifiedName.ToString())"
    }
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
