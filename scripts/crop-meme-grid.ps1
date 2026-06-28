param(
  [string]$Source = (Join-Path $PSScriptRoot "..\assets\demo-memes\meme-grid-source.png"),
  [string]$OutputDir = (Join-Path $PSScriptRoot "..\assets\demo-memes"),
  [int]$Count = 12,
  [int]$Columns = 6
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $Source)) {
  Write-Error "No se encontró la grilla de memes: $Source"
  exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$grid = [System.Drawing.Image]::FromFile($Source)
$rows = [int][math]::Ceiling($Count / $Columns)
$cellW = [int][math]::Floor($grid.Width / $Columns)
$cellH = [int][math]::Floor($grid.Height / $rows)

for ($i = 0; $i -lt $Count; $i++) {
  $col = $i % $Columns
  $row = [int][math]::Floor($i / $Columns)
  $x = $col * $cellW
  $y = $row * $cellH

  $bmp = New-Object System.Drawing.Bitmap $cellW, $cellH
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $dest = New-Object System.Drawing.Rectangle 0, 0, $cellW, $cellH
  $src = New-Object System.Drawing.Rectangle $x, $y, $cellW, $cellH
  $g.DrawImage($grid, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)

  $out = Join-Path $OutputDir ("post-{0:D2}.png" -f ($i + 1))
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
}

$grid.Dispose()
Write-Host "Listo: $Count memes en $OutputDir"
