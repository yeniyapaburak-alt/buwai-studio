$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Add-Type -AssemblyName System.Web

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "Buwai Studio yerel sunucusu baslatildi."
Write-Host "Adres: http://localhost:$port"
Write-Host "Durdurmak icin bu pencereyi kapat veya Ctrl+C yap."
Write-Host ""

Start-Process "http://localhost:$port"

function Get-ContentType($path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".png" { "image/png" }
    ".jpg" { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".gif" { "image/gif" }
    ".svg" { "image/svg+xml" }
    ".ico" { "image/x-icon" }
    ".webp" { "image/webp" }
    default { "application/octet-stream" }
  }
}

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $response = $context.Response

    $relativePath = [System.Web.HttpUtility]::UrlDecode($context.Request.Url.AbsolutePath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
      $relativePath = "index.html"
    }

    $relativePath = $relativePath -replace "/", "\"
    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))

    if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $response.StatusCode = 403
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("403")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      $response.Close()
      continue
    }

    if ((Test-Path $fullPath) -and (Get-Item $fullPath).PSIsContainer) {
      $fullPath = Join-Path $fullPath "index.html"
    }

    if (-not (Test-Path $fullPath)) {
      $response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("404")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
      $response.Close()
      continue
    }

    $response.ContentType = Get-ContentType $fullPath
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.Close()
  } catch {
    try {
      if ($response -and $response.OutputStream) {
        $response.StatusCode = 500
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("500")
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.Close()
      }
    } catch {
    }
  }
}
