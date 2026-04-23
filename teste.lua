-- Script Atualizado - GUI Funcional 100%
-- Aguarda o jogador carregar completamente
game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui")

-- Aguarda 0.5 segundos para garantir tudo carregado
wait(0.5)

local player = game.Players.LocalPlayer
local mouse = player:GetMouse()

-- Verificar se já existe GUI para não duplicar
if player.PlayerGui:FindFirstChild("AdminMenuGUI") then
    player.PlayerGui.AdminMenuGUI:Destroy()
end

-- Criar GUI principal
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "AdminMenuGUI"
screenGui.ResetOnSpawn = false -- Não resetar ao morrer
screenGui.Parent = player.PlayerGui

-- Frame principal (menu mini)
local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(0, 320, 0, 420)
mainFrame.Position = UDim2.new(0.5, -160, 0.5, -210)
mainFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 30)
mainFrame.BackgroundTransparency = 0.05
mainFrame.BorderSizePixel = 2
mainFrame.BorderColor3 = Color3.fromRGB(0, 200, 255)
mainFrame.ClipsDescendants = true
mainFrame.Active = true
mainFrame.Draggable = true
mainFrame.Parent = screenGui

-- Arredondar cantos
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = mainFrame

-- Sombra (efeito profissional)
local shadow = Instance.new("UICorner")
shadow.CornerRadius = UDim.new(0, 12)
shadow.Parent = mainFrame

local shadowEffect = Instance.new("UIStroke")
shadowEffect.Color = Color3.fromRGB(0, 0, 0)
shadowEffect.Thickness = 3
shadowEffect.Transparency = 0.8
shadowEffect.Parent = mainFrame

-- Título da GUI com gradiente
local titleBar = Instance.new("Frame")
titleBar.Name = "TitleBar"
titleBar.Size = UDim2.new(1, 0, 0, 45)
titleBar.Position = UDim2.new(0, 0, 0, 0)
titleBar.BackgroundColor3 = Color3.fromRGB(0, 150, 220)
titleBar.BackgroundTransparency = 0.2
titleBar.BorderSizePixel = 0
titleBar.Parent = mainFrame

local titleCorner = Instance.new("UICorner")
titleCorner.CornerRadius = UDim.new(0, 12)
titleCorner.Parent = titleBar

local title = Instance.new("TextLabel")
title.Name = "Title"
title.Size = UDim2.new(0.8, 0, 1, 0)
title.Position = UDim2.new(0, 15, 0, 0)
title.BackgroundTransparency = 1
title.Text = "⚡ ADMIN MENU PRO"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 18
title.Font = Enum.Font.GothamBold
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = titleBar

-- Botão de minimizar
local minimizeBtn = Instance.new("TextButton")
minimizeBtn.Name = "MinimizeBtn"
minimizeBtn.Size = UDim2.new(0, 35, 0, 35)
minimizeBtn.Position = UDim2.new(1, -45, 0, 5)
minimizeBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 70)
minimizeBtn.Text = "−"
minimizeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
minimizeBtn.TextSize = 22
minimizeBtn.Font = Enum.Font.GothamBold
minimizeBtn.BorderSizePixel = 0
minimizeBtn.Parent = titleBar

local minimizeCorner = Instance.new("UICorner")
minimizeCorner.CornerRadius = UDim.new(0, 6)
minimizeCorner.Parent = minimizeBtn

-- Botão de fechar
local closeBtn = Instance.new("TextButton")
closeBtn.Name = "CloseBtn"
closeBtn.Size = UDim2.new(0, 35, 0, 35)
closeBtn.Position = UDim2.new(1, -45, 0, 45)
closeBtn.BackgroundColor3 = Color3.fromRGB(60, 60, 70)
closeBtn.Text = "✕"
closeBtn.TextColor3 = Color3.fromRGB(255, 100, 100)
closeBtn.TextSize = 20
closeBtn.Font = Enum.Font.GothamBold
closeBtn.BorderSizePixel = 0
closeBtn.Visible = false
closeBtn.Parent = titleBar

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 6)
closeCorner.Parent = closeBtn

-- Container para conteúdo
local contentContainer = Instance.new("Frame")
contentContainer.Name = "ContentContainer"
contentContainer.Size = UDim2.new(1, -20, 1, -60)
contentContainer.Position = UDim2.new(0, 10, 0, 55)
contentContainer.BackgroundTransparency = 1
contentContainer.Parent = mainFrame

-- ScrollFrame
local scrollFrame = Instance.new("ScrollingFrame")
scrollFrame.Name = "ScrollFrame"
scrollFrame.Size = UDim2.new(1, 0, 1, 0)
scrollFrame.BackgroundTransparency = 1
scrollFrame.ScrollBarThickness = 6
scrollFrame.ScrollBarImageColor3 = Color3.fromRGB(0, 170, 255)
scrollFrame.CanvasSize = UDim2.new(0, 0, 0, 500)
scrollFrame.Parent = contentContainer

local uiList = Instance.new("UIListLayout")
uiList.Padding = UDim.new(0, 12)
uiList.SortOrder = Enum.SortOrder.LayoutOrder
uiList.Parent = scrollFrame

-- ===== SEÇÃO ESP BOX =====
local espSection = Instance.new("Frame")
espSection.Name = "ESPSection"
espSection.Size = UDim2.new(1, 0, 0, 130)
espSection.BackgroundColor3 = Color3.fromRGB(35, 35, 40)
espSection.BackgroundTransparency = 0.2
espSection.BorderSizePixel = 1
espSection.BorderColor3 = Color3.fromRGB(50, 50, 60)
espSection.Parent = scrollFrame

local espCorner = Instance.new("UICorner")
espCorner.CornerRadius = UDim.new(0, 8)
espCorner.Parent = espSection

local espTitle = Instance.new("TextLabel")
espTitle.Size = UDim2.new(1, 0, 0, 35)
espTitle.Position = UDim2.new(0, 10, 0, 0)
espTitle.BackgroundTransparency = 1
espTitle.Text = "🎯 ESP BOX & NOME"
espTitle.TextColor3 = Color3.fromRGB(0, 200, 255)
espTitle.TextSize = 14
espTitle.Font = Enum.Font.GothamSemibold
espTitle.TextXAlignment = Enum.TextXAlignment.Left
espTitle.Parent = espSection

local espToggle = Instance.new("TextButton")
espToggle.Name = "ESPToggle"
espToggle.Size = UDim2.new(0.85, 0, 0, 38)
espToggle.Position = UDim2.new(0.075, 0, 0, 42)
espToggle.BackgroundColor3 = Color3.fromRGB(55, 55, 65)
espToggle.Text = "❌ ESP DESATIVADO"
espToggle.TextColor3 = Color3.fromRGB(255, 255, 255)
espToggle.TextSize = 14
espToggle.Font = Enum.Font.GothamMedium
espToggle.BorderSizePixel = 0
espToggle.Parent = espSection

local espToggleCorner = Instance.new("UICorner")
espToggleCorner.CornerRadius = UDim.new(0, 6)
espToggleCorner.Parent = espToggle

-- Dropdown para cor
local colorDropdown = Instance.new("TextButton")
colorDropdown.Size = UDim2.new(0.85, 0, 0, 32)
colorDropdown.Position = UDim2.new(0.075, 0, 0, 86)
colorDropdown.BackgroundColor3 = Color3.fromRGB(45, 45, 55)
colorDropdown.Text = "🎨 Cor: Vermelho"
colorDropdown.TextColor3 = Color3.fromRGB(255, 255, 255)
colorDropdown.TextSize = 12
colorDropdown.Font = Enum.Font.Gotham
colorDropdown.BorderSizePixel = 0
colorDropdown.Parent = espSection

local colorCorner = Instance.new("UICorner")
colorCorner.CornerRadius = UDim.new(0, 6)
colorCorner.Parent = colorDropdown

-- ===== SEÇÃO TELEPORT =====
local teleportSection = Instance.new("Frame")
teleportSection.Name = "TeleportSection"
teleportSection.Size = UDim2.new(1, 0, 0, 200)
teleportSection.BackgroundColor3 = Color3.fromRGB(35, 35, 40)
teleportSection.BackgroundTransparency = 0.2
teleportSection.BorderSizePixel = 1
teleportSection.BorderColor3 = Color3.fromRGB(50, 50, 60)
teleportSection.Parent = scrollFrame

local teleportCorner = Instance.new("UICorner")
teleportCorner.CornerRadius = UDim.new(0, 8)
teleportCorner.Parent = teleportSection

local teleportTitle = Instance.new("TextLabel")
teleportTitle.Size = UDim2.new(1, 0, 0, 35)
teleportTitle.Position = UDim2.new(0, 10, 0, 0)
teleportTitle.BackgroundTransparency = 1
teleportTitle.Text = "✨ TELEPORT"
teleportTitle.TextColor3 = Color3.fromRGB(0, 200, 255)
teleportTitle.TextSize = 14
teleportTitle.Font = Enum.Font.GothamSemibold
teleportTitle.TextXAlignment = Enum.TextXAlignment.Left
teleportTitle.Parent = teleportSection

-- Select menu
local playerDropdown = Instance.new("TextButton")
playerDropdown.Name = "PlayerDropdown"
playerDropdown.Size = UDim2.new(0.85, 0, 0, 38)
playerDropdown.Position = UDim2.new(0.075, 0, 0, 42)
playerDropdown.BackgroundColor3 = Color3.fromRGB(55, 55, 65)
playerDropdown.Text = "👤 Selecionar Player..."
playerDropdown.TextColor3 = Color3.fromRGB(255, 255, 255)
playerDropdown.TextSize = 14
playerDropdown.Font = Enum.Font.GothamMedium
playerDropdown.BorderSizePixel = 0
playerDropdown.Parent = teleportSection

local playerCorner = Instance.new("UICorner")
playerCorner.CornerRadius = UDim.new(0, 6)
playerCorner.Parent = playerDropdown

-- Lista de players
local playerListFrame = Instance.new("ScrollingFrame")
playerListFrame.Name = "PlayerListFrame"
playerListFrame.Size = UDim2.new(0.85, 0, 0, 100)
playerListFrame.Position = UDim2.new(0.075, 0, 0, 84)
playerListFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 48)
playerListFrame.BackgroundTransparency = 0
playerListFrame.BorderSizePixel = 1
playerListFrame.BorderColor3 = Color3.fromRGB(0, 170, 255)
playerListFrame.Visible = false
playerListFrame.ScrollBarThickness = 5
playerListFrame.Parent = teleportSection

local playerListCorner = Instance.new("UICorner")
playerListCorner.CornerRadius = UDim.new(0, 6)
playerListCorner.Parent = playerListFrame

local playerListLayout = Instance.new("UIListLayout")
playerListLayout.Padding = UDim.new(0, 3)
playerListLayout.Parent = playerListFrame

-- Botão teleportar
local teleportBtn = Instance.new("TextButton")
teleportBtn.Name = "TeleportBtn"
teleportBtn.Size = UDim2.new(0.85, 0, 0, 42)
teleportBtn.Position = UDim2.new(0.075, 0, 0, 148)
teleportBtn.BackgroundColor3 = Color3.fromRGB(0, 150, 220)
teleportBtn.Text = "🚀 TELEPORTAR"
teleportBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
teleportBtn.TextSize = 15
teleportBtn.Font = Enum.Font.GothamBold
teleportBtn.BorderSizePixel = 0
teleportBtn.Parent = teleportSection

local teleportBtnCorner = Instance.new("UICorner")
teleportBtnCorner.CornerRadius = UDim.new(0, 6)
teleportBtnCorner.Parent = teleportBtn

-- Variáveis
local espActive = false
local selectedPlayer = nil
local espColor = Color3.fromRGB(255, 0, 0)
local espObjects = {}
local minimized = false

-- Função para atualizar lista
local function updatePlayerList()
    for _, child in pairs(playerListFrame:GetChildren()) do
        if child:IsA("TextButton") then
            child:Destroy()
        end
    end
    
    local players = game.Players:GetPlayers()
    for _, plr in pairs(players) do
        if plr ~= player then
            local btn = Instance.new("TextButton")
            btn.Size = UDim2.new(1, 0, 0, 32)
            btn.BackgroundColor3 = Color3.fromRGB(50, 50, 58)
            btn.Text = plr.Name
            btn.TextColor3 = Color3.fromRGB(255, 255, 255)
            btn.TextSize = 12
            btn.Font = Enum.Font.Gotham
            btn.BorderSizePixel = 0
            btn.Parent = playerListFrame
            
            local btnCorner = Instance.new("UICorner")
            btnCorner.CornerRadius = UDim.new(0, 4)
            btnCorner.Parent = btn
            
            btn.MouseButton1Click:Connect(function()
                selectedPlayer = plr
                playerDropdown.Text = "👤 " .. plr.Name
                playerListFrame.Visible = false
            end)
        end
    end
    playerListFrame.CanvasSize = UDim2.new(0, 0, 0, #players * 35)
end

-- Função ESP
local function createESPBox(targetPlayer)
    if not targetPlayer or not targetPlayer.Character or not targetPlayer.Character:FindFirstChild("HumanoidRootPart") then
        return nil
    end
    
    local espGui = Instance.new("BillboardGui")
    espGui.Name = "ESPBox_" .. targetPlayer.Name
    espGui.Size = UDim2.new(0, 4, 0, 5)
    espGui.Adornee = targetPlayer.Character.HumanoidRootPart
    espGui.AlwaysOnTop = true
    espGui.Parent = targetPlayer.Character.HumanoidRootPart
    
    local boxFrame = Instance.new("Frame")
    boxFrame.Size = UDim2.new(1, 0, 1, 0)
    boxFrame.BackgroundTransparency = 0.7
    boxFrame.BackgroundColor3 = espColor
    boxFrame.BorderSizePixel = 2
    boxFrame.BorderColor3 = espColor
    boxFrame.Parent = espGui
    
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(2, 0, 0, 22)
    nameLabel.Position = UDim2.new(-0.5, 0, -1.2, -5)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = targetPlayer.Name
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.TextSize = 13
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.TextStrokeTransparency = 0.3
    nameLabel.TextXAlignment = Enum.TextXAlignment.Center
    nameLabel.Parent = espGui
    
    table.insert(espObjects, espGui)
    return espGui
end

local function removeAllESP()
    for _, esp in pairs(espObjects) do
        if esp and esp.Parent then
            esp:Destroy()
        end
    end
    espObjects = {}
end

local function updateESP()
    removeAllESP()
    if espActive then
        for _, plr in pairs(game.Players:GetPlayers()) do
            if plr ~= player then
                createESPBox(plr)
            end
        end
    end
end

-- Eventos
game.Players.PlayerAdded:Connect(function(plr)
    updateESP()
    updatePlayerList()
    plr.CharacterAdded:Connect(function()
        if espActive then
            task.wait(0.5)
            createESPBox(plr)
        end
    end)
end)

game.Players.PlayerRemoving:Connect(function()
    updateESP()
    updatePlayerList()
end)

for _, plr in pairs(game.Players:GetPlayers()) do
    if plr ~= player then
        plr.CharacterAdded:Connect(function()
            if espActive then
                task.wait(0.5)
                createESPBox(plr)
            end
        end)
    end
end

-- ===== FUNCIONALIDADES =====

-- Minimizar
minimizeBtn.MouseButton1Click:Connect(function()
    minimized = not minimized
    if minimized then
        mainFrame:TweenSize(UDim2.new(0, 320, 0, 50), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.3, true)
        contentContainer.Visible = false
        minimizeBtn.Text = "+"
        mainFrame.Draggable = true
    else
        mainFrame:TweenSize(UDim2.new(0, 320, 0, 420), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.3, true)
        contentContainer.Visible = true
        minimizeBtn.Text = "−"
    end
end)

-- ESP
espToggle.MouseButton1Click:Connect(function()
    espActive = not espActive
    if espActive then
        espToggle.Text = "✅ ESP ATIVADO"
        espToggle.BackgroundColor3 = Color3.fromRGB(0, 170, 100)
        updateESP()
    else
        espToggle.Text = "❌ ESP DESATIVADO"
        espToggle.BackgroundColor3 = Color3.fromRGB(55, 55, 65)
        removeAllESP()
    end
end)

-- Cores
local colors = {
    {name = "Vermelho", color = Color3.fromRGB(255, 0, 0)},
    {name = "Verde", color = Color3.fromRGB(0, 255, 0)},
    {name = "Azul", color = Color3.fromRGB(0, 0, 255)},
    {name = "Amarelo", color = Color3.fromRGB(255, 255, 0)},
    {name = "Roxo", color = Color3.fromRGB(255, 0, 255)},
    {name = "Ciano", color = Color3.fromRGB(0, 255, 255)}
}

local colorIndex = 1
colorDropdown.MouseButton1Click:Connect(function()
    colorIndex = colorIndex % #colors + 1
    local selected = colors[colorIndex]
    espColor = selected.color
    colorDropdown.Text = "🎨 Cor: " .. selected.name
    colorDropdown.BackgroundColor3 = Color3.fromRGB(selected.color.R * 0.3, selected.color.G * 0.3, selected.color.B * 0.3)
    if espActive then
        updateESP()
    end
end)

-- Dropdown players
playerDropdown.MouseButton1Click:Connect(function()
    playerListFrame.Visible = not playerListFrame.Visible
    updatePlayerList()
end)

-- Teleport
teleportBtn.MouseButton1Click:Connect(function()
    if selectedPlayer and selectedPlayer.Character and selectedPlayer.Character:FindFirstChild("HumanoidRootPart") then
        local character = player.Character
        if character and character:FindFirstChild("HumanoidRootPart") then
            local hrp = character.HumanoidRootPart
            local targetHRP = selectedPlayer.Character.HumanoidRootPart
            hrp.CFrame = targetHRP.CFrame + Vector3.new(0, 3, 0)
            
            teleportBtn.Text = "✅ TELEPORTADO!"
            teleportBtn.BackgroundColor3 = Color3.fromRGB(0, 200, 100)
            task.wait(1)
            teleportBtn.Text = "🚀 TELEPORTAR"
            teleportBtn.BackgroundColor3 = Color3.fromRGB(0, 150, 220)
            playerListFrame.Visible = false
        end
    else
        teleportBtn.Text = "❌ PLAYER INVÁLIDO!"
        teleportBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
        task.wait(1)
        teleportBtn.Text = "🚀 TELEPORTAR"
        teleportBtn.BackgroundColor3 = Color3.fromRGB(0, 150, 220)
    end
end)

-- Animar ao abrir
mainFrame:TweenSize(UDim2.new(0, 340, 0, 440), Enum.EasingDirection.Out, Enum.EasingStyle.Elastic, 0.5, true)
task.wait(0.15)
mainFrame:TweenSize(UDim2.new(0, 320, 0, 420), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.2, true)

-- Inicializar
updatePlayerList()
scrollFrame.CanvasSize = UDim2.new(0, 0, 0, 360)

-- Notificação de sucesso
game:GetService("StarterGui"):SetCore("SendNotification", {
    Title = "✅ GUI Carregada",
    Text = "Menu ADMIN PRO ativado com sucesso!",
    Duration = 3,
    Icon = "rbxassetid://123456789"
})

print("✅ GUI ADMIN MENU PRO carregada com sucesso!")
