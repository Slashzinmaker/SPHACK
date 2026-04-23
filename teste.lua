-- ============================================
-- ESP PARA CELULAR - VERSÃO OTIMIZADA
-- ============================================

local player = game.Players.LocalPlayer
local espAtivo = true
local cor = Color3.fromRGB(255, 0, 0) -- vermelho
local espObjetos = {}

-- Função para notificar (já funcionou no seu teste)
local function notificar(titulo, texto)
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = titulo,
            Text = texto,
            Duration = 3
        })
    end)
end

-- Criar ESP usando HIGHLIGHT (mais compatível com mobile)
local function criarHighlight(jogador)
    if not jogador or jogador == player then return nil end
    if not jogador.Character then return nil end
    
    local highlight = Instance.new("Highlight")
    highlight.Name = "ESP_" .. jogador.Name
    highlight.FillColor = cor
    highlight.FillTransparency = 0.7
    highlight.OutlineColor = cor
    highlight.OutlineTransparency = 0.3
    highlight.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
    highlight.Parent = jogador.Character
    
    -- Criar texto com nome (usando BillboardGui pois Highlight não tem texto)
    local hrp = jogador.Character:FindFirstChild("HumanoidRootPart")
    if hrp then
        local bill = Instance.new("BillboardGui")
        bill.Name = "Nome_" .. jogador.Name
        bill.Size = UDim2.new(0, 4, 0, 2)
        bill.Adornee = hrp
        bill.AlwaysOnTop = true
        bill.StudsOffset = Vector3.new(0, 2.5, 0)
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = jogador.Name
        label.TextColor3 = Color3.fromRGB(255, 255, 255)
        label.TextSize = 16
        label.Font = Enum.Font.GothamBold
        label.TextStrokeTransparency = 0.3
        label.Parent = bill
        
        bill.Parent = hrp
        return {highlight = highlight, billboard = bill}
    end
    
    return {highlight = highlight}
end

-- Criar ESP para teste no próprio jogador (assim você vê se funciona)
local function criarEspTeste()
    if not player.Character then return nil end
    local highlight = Instance.new("Highlight")
    highlight.Name = "AutoESP_Teste"
    highlight.FillColor = Color3.fromRGB(0, 255, 0)
    highlight.FillTransparency = 0.5
    highlight.OutlineColor = Color3.fromRGB(0, 255, 0)
    highlight.Parent = player.Character
    
    -- Texto flutuante no próprio jogador
    local hrp = player.Character:FindFirstChild("HumanoidRootPart")
    if hrp then
        local bill = Instance.new("BillboardGui")
        bill.Size = UDim2.new(0, 4, 0, 2)
        bill.Adornee = hrp
        bill.AlwaysOnTop = true
        bill.StudsOffset = Vector3.new(0, 3, 0)
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = "🎯 VOCÊ (TESTE)"
        label.TextColor3 = Color3.fromRGB(0, 255, 0)
        label.TextSize = 14
        label.Font = Enum.Font.GothamBold
        label.Parent = bill
        
        bill.Parent = hrp
        return {highlight = highlight, billboard = bill}
    end
    return {highlight = highlight}
end

-- Remover todos os ESPs
local function limparESP()
    for _, obj in pairs(espObjetos) do
        if obj.highlight then obj.highlight:Destroy() end
        if obj.billboard then obj.billboard:Destroy() end
    end
    espObjetos = {}
end

-- Atualizar ESP para todos os jogadores (exceto você)
local function atualizarESP()
    if not espAtivo then return end
    
    for _, plr in pairs(game.Players:GetPlayers()) do
        if plr ~= player then
            -- Evitar duplicar
            local jaExiste = false
            for _, obj in pairs(espObjetos) do
                if obj.highlight and obj.highlight.Name == "ESP_" .. plr.Name then
                    jaExiste = true
                    break
                end
            end
            if not jaExiste and plr.Character then
                local esp = criarHighlight(plr)
                if esp then
                    table.insert(espObjetos, esp)
                end
            end
        end
    end
end

-- Quando um jogador entrar
game.Players.PlayerAdded:Connect(function(plr)
    plr.CharacterAdded:Connect(function()
        task.wait(0.5)
        if espAtivo and plr ~= player then
            local esp = criarHighlight(plr)
            if esp then table.insert(espObjetos, esp) end
        end
    end)
    task.wait(0.5)
    if espAtivo and plr ~= player and plr.Character then
        local esp = criarHighlight(plr)
        if esp then table.insert(espObjetos, esp) end
    end
end)

-- Quando um jogador sair
game.Players.PlayerRemoving:Connect(function(plr)
    for i, obj in pairs(espObjetos) do
        if obj.highlight and obj.highlight.Name == "ESP_" .. plr.Name then
            obj.highlight:Destroy()
            if obj.billboard then obj.billboard:Destroy() end
            table.remove(espObjetos, i)
            break
        end
    end
end)

-- Respawn dos jogadores já existentes
for _, plr in pairs(game.Players:GetPlayers()) do
    if plr ~= player then
        plr.CharacterAdded:Connect(function()
            task.wait(0.5)
            if espAtivo then
                -- Remove antigo se existir
                for i, obj in pairs(espObjetos) do
                    if obj.highlight and obj.highlight.Name == "ESP_" .. plr.Name then
                        obj.highlight:Destroy()
                        if obj.billboard then obj.billboard:Destroy() end
                        table.remove(espObjetos, i)
                        break
                    end
                end
                local esp = criarHighlight(plr)
                if esp then table.insert(espObjetos, esp) end
            end
        end)
    end
end

-- ESP de teste em VOCÊ mesmo (assim vai aparecer algo)
local testeEsp = criarEspTeste()
if testeEsp then
    table.insert(espObjetos, testeEsp)
    notificar("🧪 ESP Teste", "Caixa verde em VOCÊ! Se viu, o ESP funciona. Agora entre em um jogo com outros players.")
else
    notificar("⚠️ Atenção", "Não foi possível criar ESP em você. Pode ser que o jogo bloqueie. Tente em outro jogo.")
end

-- Iniciar ESP nos outros
atualizarESP()

-- Botão flutuante permanentemente visível (para saber que está rodando)
local function criarBotaoStatus()
    local gui = Instance.new("ScreenGui")
    gui.Name = "ESPStatus"
    gui.ResetOnSpawn = false
    pcall(function() gui.Parent = player.PlayerGui end)
    if not gui.Parent then
        pcall(function() gui.Parent = game:GetService("CoreGui") end)
    end
    
    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 140, 0, 35)
    frame.Position = UDim2.new(1, -150, 1, -45)
    frame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
    frame.BackgroundTransparency = 0.6
    frame.BorderSizePixel = 1
    frame.BorderColor3 = Color3.fromRGB(255, 0, 0)
    frame.Parent = gui
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, 8)
    corner.Parent = frame
    
    local texto = Instance.new("TextLabel")
    texto.Size = UDim2.new(1, 0, 1, 0)
    texto.BackgroundTransparency = 1
    texto.Text = "🔴 ESP ATIVO"
    texto.TextColor3 = Color3.fromRGB(255, 255, 255)
    texto.TextSize = 14
    texto.Font = Enum.Font.GothamBold
    texto.Parent = frame
    
    -- Pisca a borda
    spawn(function()
        while true do
            task.wait(1)
            if frame.BorderColor3 == Color3.fromRGB(255, 0, 0) then
                frame.BorderColor3 = Color3.fromRGB(0, 255, 0)
                texto.Text = "🟢 ESP ATIVO"
            else
                frame.BorderColor3 = Color3.fromRGB(255, 0, 0)
                texto.Text = "🔴 ESP ATIVO"
            end
        end
    end)
end

criarBotaoStatus()

-- Notificação final
notificar("✅ ESP Carregado", "Caixa verde em você + borda piscando. Se não viu a caixa, o jogo pode não permitir. Teste em outro jogo.")
