-- ============================================
-- ESP MOBILE FIXED
-- ============================================

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
repeat task.wait() until player

-- Espera character 100%
local function getCharacter(plr)
    local char = plr.Character or plr.CharacterAdded:Wait()
    repeat task.wait() until char:FindFirstChild("HumanoidRootPart")
    return char
end

local espList = {}
local espColor = Color3.fromRGB(255,0,0)

-- CRIA ESP
local function createESP(plr)
    if plr == player then return end
    
    local char = getCharacter(plr)
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end

    -- evita duplicado
    if hrp:FindFirstChild("ESP") then return end

    local bill = Instance.new("BillboardGui")
    bill.Name = "ESP"
    bill.Size = UDim2.new(0, 60, 0, 80) -- maior (mobile)
    bill.AlwaysOnTop = true
    bill.Adornee = hrp
    bill.StudsOffset = Vector3.new(0,3,0)

    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(1,0,1,0)
    frame.BackgroundTransparency = 0.4
    frame.BackgroundColor3 = espColor
    frame.BorderSizePixel = 2
    frame.BorderColor3 = espColor
    frame.Parent = bill

    local name = Instance.new("TextLabel")
    name.Size = UDim2.new(1,0,0,18)
    name.Position = UDim2.new(0,0,-0.4,0)
    name.BackgroundTransparency = 1
    name.Text = plr.Name
    name.TextScaled = true
    name.TextColor3 = Color3.new(1,1,1)
    name.Parent = bill

    local dist = Instance.new("TextLabel")
    dist.Size = UDim2.new(1,0,0,16)
    dist.Position = UDim2.new(0,0,1,0)
    dist.BackgroundTransparency = 1
    dist.TextScaled = true
    dist.TextColor3 = Color3.new(1,1,1)
    dist.Parent = bill

    bill.Parent = hrp

    -- LOOP distância
    local conn
    conn = RunService.RenderStepped:Connect(function()
        if not bill or not bill.Parent then
            conn:Disconnect()
            return
        end

        local myChar = player.Character
        if myChar and myChar:FindFirstChild("HumanoidRootPart") then
            local d = (myChar.HumanoidRootPart.Position - hrp.Position).Magnitude
            dist.Text = math.floor(d).."m"
        end
    end)

    table.insert(espList, {bill, conn})
end

-- LIMPA
local function clearESP()
    for _,v in pairs(espList) do
        if v[1] then v[1]:Destroy() end
        if v[2] then v[2]:Disconnect() end
    end
    espList = {}
end

-- REFRESH FORÇADO
local function refresh()
    clearESP()
    for _,plr in pairs(Players:GetPlayers()) do
        task.spawn(function()
            createESP(plr)
        end)
    end
end

-- MONITORAMENTO CONSTANTE (corrige falhas no mobile)
task.spawn(function()
    while true do
        task.wait(2)
        refresh()
    end
end)

-- EVENTOS
Players.PlayerAdded:Connect(function(plr)
    plr.CharacterAdded:Connect(function()
        task.wait(1)
        createESP(plr)
    end)
end)

-- START
refresh()
