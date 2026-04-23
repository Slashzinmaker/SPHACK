-- ESP AUTOMÁTICO - SEM MENU
-- Ativa sozinho ao executar

local player = game.Players.LocalPlayer
local espActive = true
local espColor = Color3.fromRGB(255, 0, 0) -- Vermelho padrão
local espObjects = {}

-- Criar ESP para um player
local function createESPBox(targetPlayer)
    if not targetPlayer or not targetPlayer.Character then
        return nil
    end
    
    local hrp = targetPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not hrp then
        return nil
    end
    
    local espGui = Instance.new("BillboardGui")
    espGui.Name = "ESP_" .. targetPlayer.Name
    espGui.Size = UDim2.new(0, 4, 0, 5)
    espGui.Adornee = hrp
    espGui.AlwaysOnTop = true
    espGui.Parent = hrp
    
    -- Caixa ao redor
    local boxFrame = Instance.new("Frame")
    boxFrame.Size = UDim2.new(1, 0, 1, 0)
    boxFrame.BackgroundTransparency = 0.7
    boxFrame.BackgroundColor3 = espColor
    boxFrame.BorderSizePixel = 2
    boxFrame.BorderColor3 = espColor
    boxFrame.Parent = espGui
    
    -- Nome do player
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
    
    -- Distância (opcional)
    local distanceLabel = Instance.new("TextLabel")
    distanceLabel.Size = UDim2.new(2, 0, 0, 18)
    distanceLabel.Position = UDim2.new(-0.5, 0, 0.5, 5)
    distanceLabel.BackgroundTransparency = 1
    distanceLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    distanceLabel.TextSize = 11
    distanceLabel.Font = Enum.Font.Gotham
    distanceLabel.TextStrokeTransparency = 0.5
    distanceLabel.TextXAlignment = Enum.TextXAlignment.Center
    distanceLabel.Parent = espGui
    
    -- Atualizar distância
    local function updateDistance()
        if not espActive or not player.Character or not player.Character:FindFirstChild("HumanoidRootPart") then
            return
        end
        if targetPlayer.Character and targetPlayer.Character:FindFirstChild("HumanoidRootPart") then
            local distance = (player.Character.HumanoidRootPart.Position - targetPlayer.Character.HumanoidRootPart.Position).Magnitude
            distanceLabel.Text = math.floor(distance) .. " studs"
        end
    end
    
    -- Loop de distância a cada 0.5 segundos
    local connection
    connection = game:GetService("RunService").Heartbeat:Connect(function()
        if not espActive or not espGui.Parent then
            connection:Disconnect()
            return
        end
        updateDistance()
    end)
    
    table.insert(espObjects, {gui = espGui, connection = connection})
    return espGui
end

-- Remover todas ESPs
local function removeAllESP()
    for _, esp in pairs(espObjects) do
        if esp.gui and esp.gui.Parent then
            esp.gui:Destroy()
        end
        if esp.connection then
            esp.connection:Disconnect()
        end
    end
    espObjects = {}
end

-- Atualizar ESP para todos os players
local function updateAllESP()
    removeAllESP()
    if not espActive then
        return
    end
    
    for _, plr in pairs(game.Players:GetPlayers()) do
        if plr ~= player then
            createESPBox(plr)
        end
    end
end

-- Quando um player entra
game.Players.PlayerAdded:Connect(function(plr)
    if not espActive then
        return
    end
    plr.CharacterAdded:Connect(function()
        task.wait(0.5)
        if espActive and plr ~= player then
            createESPBox(plr)
        end
    end)
    task.wait(0.5)
    if espActive and plr ~= player then
        createESPBox(plr)
    end
end)

-- Quando um player sai
game.Players.PlayerRemoving:Connect(function(plr)
    for i, esp in pairs(espObjects) do
        if esp.gui and esp.gui.Name == "ESP_" .. plr.Name then
            if esp.gui.Parent then
                esp.gui:Destroy()
            end
            if esp.connection then
                esp.connection:Disconnect()
            end
            table.remove(espObjects, i)
            break
        end
    end
end)

-- Monitorar respawn dos players existentes
for _, plr in pairs(game.Players:GetPlayers()) do
    if plr ~= player then
        plr.CharacterAdded:Connect(function()
            task.wait(0.5)
            if espActive then
                -- Remover ESP antiga se existir
                for i, esp in pairs(espObjects) do
                    if esp.gui and esp.gui.Name == "ESP_" .. plr.Name then
                        if esp.gui.Parent then
                            esp.gui:Destroy()
                        end
                        if esp.connection then
                            esp.connection:Disconnect()
                        end
                        table.remove(espObjects, i)
                        break
                    end
                end
                createESPBox(plr)
            end
        end)
    end
end

-- Inicializar ESP
updateAllESP()

-- Comandos via chat (opcional - pode remover se não quiser)
game:GetService("StarterGui"):SetCore("SendNotification", {
    Title = "🔴 ESP ATIVADO",
    Text = "ESP automático ligado! Comandos: !esp ou !cor",
    Duration = 3
})

-- Comandos no chat (opcional)
game:GetService("Players").LocalPlayer.Chatted:Connect(function(msg)
    if msg:lower() == "!esp off" then
        espActive = false
        removeAllESP()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = "🔴 ESP",
            Text = "ESP desativado",
            Duration = 2
        })
    elseif msg:lower() == "!esp on" then
        espActive = true
        updateAllESP()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = "🟢 ESP",
            Text = "ESP ativado",
            Duration = 2
        })
    elseif msg:lower() == "!cor vermelho" then
        espColor = Color3.fromRGB(255, 0, 0)
        updateAllESP()
    elseif msg:lower() == "!cor verde" then
        espColor = Color3.fromRGB(0, 255, 0)
        updateAllESP()
    elseif msg:lower() == "!cor azul" then
        espColor = Color3.fromRGB(0, 0, 255)
        updateAllESP()
    end
end)

print("✅ ESP Automático carregado!")
