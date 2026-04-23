-- ============================================
-- SCRIPT ESP AUTOMÁTICO COM VERIFICAÇÃO TOTAL
-- ============================================

-- Tenta criar notificação para o usuário
local function notify(title, text, duration)
    duration = duration or 3
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = title,
            Text = text,
            Duration = duration
        })
    end)
end

-- 1. Verificar se o script está rodando
print("[ESP] Script iniciado - Verifique o console (F9)")
notify("🔧 Carregando", "Inicializando ESP...", 2)

-- 2. Aguardar jogador e ambiente
local player = game.Players.LocalPlayer
if not player then
    warn("[ESP] Erro: LocalPlayer não encontrado")
    notify("❌ Erro", "Jogador não localizado", 3)
    return
end

-- Aguardar o personagem (importante para ESP)
if not player.Character then
    player.CharacterAdded:Wait()
end

-- 3. Configurações
local espActive = true
local espColor = Color3.fromRGB(255, 0, 0) -- vermelho
local espList = {} -- armazena as ESPs ativas

-- 4. Função para criar ESP em um player
local function createESP(targetPlayer)
    -- Verificações de segurança
    if not targetPlayer or targetPlayer == player then return nil end
    if not targetPlayer.Character then return nil end
    
    local hrp = targetPlayer.Character:FindFirstChild("HumanoidRootPart")
    if not hrp then return nil end
    
    -- Criar BillboardGui
    local billboard = Instance.new("BillboardGui")
    billboard.Name = "ESP_" .. targetPlayer.Name
    billboard.Size = UDim2.new(0, 4, 0, 5)
    billboard.Adornee = hrp
    billboard.AlwaysOnTop = true
    billboard.StudsOffset = Vector3.new(0, 2, 0)
    
    -- Caixa (frame)
    local box = Instance.new("Frame")
    box.Size = UDim2.new(1, 0, 1, 0)
    box.BackgroundTransparency = 0.7
    box.BackgroundColor3 = espColor
    box.BorderSizePixel = 2
    box.BorderColor3 = espColor
    box.Parent = billboard
    
    -- Nome do jogador
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 0, 20)
    nameLabel.Position = UDim2.new(0, 0, -1.2, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = targetPlayer.Name
    nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    nameLabel.TextSize = 14
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.TextStrokeTransparency = 0.3
    nameLabel.Parent = billboard
    
    -- Distância (opcional)
    local distLabel = Instance.new("TextLabel")
    distLabel.Size = UDim2.new(1, 0, 0, 18)
    distLabel.Position = UDim2.new(0, 0, 1, 5)
    distLabel.BackgroundTransparency = 1
    distLabel.Text = "0"
    distLabel.TextColor3 = Color3.fromRGB(200, 200, 200)
    distLabel.TextSize = 12
    distLabel.Font = Enum.Font.Gotham
    distLabel.Parent = billboard
    
    -- Atualizar distância a cada frame
    local heartbeat
    heartbeat = game:GetService("RunService").Heartbeat:Connect(function()
        if not billboard or not billboard.Parent then
            if heartbeat then heartbeat:Disconnect() end
            return
        end
        if player.Character and player.Character:FindFirstChild("HumanoidRootPart") and targetPlayer.Character and targetPlayer.Character:FindFirstChild("HumanoidRootPart") then
            local dist = (player.Character.HumanoidRootPart.Position - targetPlayer.Character.HumanoidRootPart.Position).Magnitude
            distLabel.Text = math.floor(dist) .. "s"
        else
            distLabel.Text = "?"
        end
    end)
    
    billboard.Parent = hrp
    
    -- Armazenar para limpeza posterior
    table.insert(espList, {billboard = billboard, heartbeat = heartbeat})
    return billboard
end

-- 5. Remover todas as ESPs
local function removeAllESP()
    for _, item in ipairs(espList) do
        if item.billboard and item.billboard.Parent then
            item.billboard:Destroy()
        end
        if item.heartbeat then
            item.heartbeat:Disconnect()
        end
    end
    espList = {}
end

-- 6. Atualizar ESP para todos os jogadores
local function refreshESP()
    removeAllESP()
    if not espActive then return end
    
    for _, plr in ipairs(game.Players:GetPlayers()) do
        if plr ~= player then
            createESP(plr)
        end
    end
end

-- 7. Eventos de entrada/saída/respawn
game.Players.PlayerAdded:Connect(function(plr)
    if not espActive then return end
    plr.CharacterAdded:Connect(function()
        task.wait(0.3)
        if espActive and plr ~= player then
            createESP(plr)
        end
    end)
    if espActive then
        task.wait(0.3)
        createESP(plr)
    end
end)

game.Players.PlayerRemoving:Connect(function(plr)
    for i, item in ipairs(espList) do
        if item.billboard and item.billboard.Name == "ESP_" .. plr.Name then
            item.billboard:Destroy()
            if item.heartbeat then item.heartbeat:Disconnect() end
            table.remove(espList, i)
            break
        end
    end
end)

-- Respawn dos jogadores já existentes
for _, plr in ipairs(game.Players:GetPlayers()) do
    if plr ~= player then
        plr.CharacterAdded:Connect(function()
            task.wait(0.3)
            if espActive then
                createESP(plr)
            end
        end)
    end
end

-- 8. Iniciar ESP!
refreshESP()

-- 9. Feedback visual garantido (um botão flutuante simples para mostrar que rodou)
local function criarIndicador()
    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = "ESPLoadedIndicator"
    screenGui.ResetOnSpawn = false
    pcall(function()
        screenGui.Parent = player.PlayerGui
    end)
    if not screenGui.Parent then
        pcall(function()
            screenGui.Parent = game:GetService("CoreGui")
        end)
    end
    
    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 120, 0, 30)
    frame.Position = UDim2.new(1, -130, 0, 10)
    frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    frame.BackgroundTransparency = 0.5
    frame.BorderSizePixel = 0
    frame.Parent = screenGui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = frame
    
    local label = Instance.new("TextLabel")
    label.Size = UDim2.new(1, 0, 1, 0)
    label.BackgroundTransparency = 1
    label.Text = "🔴 ESP ATIVO"
    label.TextColor3 = Color3.fromRGB(255, 255, 255)
    label.TextSize = 12
    label.Font = Enum.Font.GothamBold
    label.Parent = frame
    
    -- Desaparece após 5 segundos
    task.wait(5)
    frame:TweenSize(UDim2.new(0, 0, 0, 0), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.3, true)
    task.wait(0.3)
    screenGui:Destroy()
end

task.spawn(criarIndicador)

-- Notificação final
notify("✅ ESP Ativado", "Caixas e nomes visíveis em outros jogadores", 3)
print("[ESP] Script executado com sucesso! ESP ativo para todos os outros jogadores.")
