class GraphCycles {
    constructor() {
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.vertexCount = 6;
        this.edgeDensity = 0.6;
        this.vertices = [];
        this.edges = [];
        this.adjacencyMatrix = [];
        this.currentPath = [];
        this.pathHistory = []; // For undo functionality
        this.currentMode = null; // 'hamiltonian', 'eulerian', 'tsp'
        this.selectedVertex = null;
        this.edgeWeights = [];
        this.autoCompleteTimeout = null;
        this.isCompleted = false;
        
        // Visual constants
        this.vertexRadius = 20;
        this.colors = {
            vertex: '#3b82f6',
            selectedVertex: '#ef4444',
            pathVertex: '#22c55e',
            edge: '#6b7280',
            pathEdge: '#22c55e',
            background: '#ffffff'
        };
        
        this.setupCanvas();
        this.generateGraph();
        this.setupChallengeDropdown();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }
    
    setupChallengeDropdown() {
        const challengeSelect = document.getElementById('challengeSelect');
        if (challengeSelect) {
            challengeSelect.addEventListener('change', (e) => {
                const selectedChallenge = e.target.value;
                if (selectedChallenge) {
                    this.startChallenge(selectedChallenge);
                }
            });
        }
    }
    
    startChallenge(type) {
        switch(type) {
            case 'hamiltonian':
                this.startHamiltonian();
                break;
            case 'eulerian':
                this.startEulerian();
                break;
            case 'tsp':
                this.startTSP();
                break;
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerStyle = window.getComputedStyle(container);
        const containerWidth = container.clientWidth - 
            parseFloat(containerStyle.paddingLeft) - 
            parseFloat(containerStyle.paddingRight);
        
        const containerHeight = Math.min(containerWidth * 0.6, 400);
        
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';
        
        const scale = window.devicePixelRatio || 1;
        this.canvas.width = containerWidth * scale;
        this.canvas.height = containerHeight * scale;
        
        this.ctx.scale(scale, scale);
        this.draw();
    }
    
    generateGraph() {
        this.vertices = [];
        this.edges = [];
        this.adjacencyMatrix = [];
        this.edgeWeights = [];
        this.currentPath = [];
        this.pathHistory = [];
        this.isCompleted = false;
        this.currentMode = null;
        
        // Reset UI elements
        const challengeSelect = document.getElementById('challengeSelect');
        if (challengeSelect) {
            challengeSelect.value = '';
        }
        document.getElementById('challengeQuestion').textContent = 'Select a cycle type to start!';
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
        this.hideFeedback();
        
        // Clear any pending auto-complete
        if (this.autoCompleteTimeout) {
            clearTimeout(this.autoCompleteTimeout);
            this.autoCompleteTimeout = null;
        }
        
        // Generate vertices in a circle for better visualization
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(centerX, centerY) * 0.7;
        
        for (let i = 0; i < this.vertexCount; i++) {
            const angle = (2 * Math.PI * i) / this.vertexCount - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.vertices.push({ x, y, id: i, label: String.fromCharCode(65 + i) });
        }
        
        // Initialize adjacency matrix
        this.adjacencyMatrix = Array(this.vertexCount).fill().map(() => Array(this.vertexCount).fill(0));
        this.edgeWeights = Array(this.vertexCount).fill().map(() => Array(this.vertexCount).fill(0));
        
        // Generate edges based on density
        const maxEdges = (this.vertexCount * (this.vertexCount - 1)) / 2;
        const targetEdges = Math.floor(maxEdges * this.edgeDensity);
        
        // Ensure graph is connected by creating a cycle first
        for (let i = 0; i < this.vertexCount; i++) {
            const next = (i + 1) % this.vertexCount;
            this.addEdge(i, next);
        }
        
        // Add random edges to reach target density
        while (this.edges.length < targetEdges) {
            const v1 = Math.floor(Math.random() * this.vertexCount);
            const v2 = Math.floor(Math.random() * this.vertexCount);
            
            if (v1 !== v2 && this.adjacencyMatrix[v1][v2] === 0) {
                this.addEdge(v1, v2);
            }
        }
        
        // Ensure all vertices have even degree for Eulerian cycles
        this.ensureEvenDegrees();
        
        this.updateGraphInfo();
        this.draw();
    }
    
    addEdge(v1, v2) {
        this.adjacencyMatrix[v1][v2] = 1;
        this.adjacencyMatrix[v2][v1] = 1;
        
        // Generate random weight for TSP
        const weight = Math.floor(Math.random() * 9) + 1;
        this.edgeWeights[v1][v2] = weight;
        this.edgeWeights[v2][v1] = weight;
        
        this.edges.push({ v1, v2, weight });
    }
    
    handleCanvasClick(event) {
        if (!this.currentMode || this.isCompleted) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Find clicked vertex
        for (let vertex of this.vertices) {
            const dx = x - vertex.x;
            const dy = y - vertex.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.vertexRadius) {
                this.selectVertex(vertex.id);
                break;
            }
        }
    }
    
    selectVertex(vertexId) {
        if (this.currentPath.length === 0) {
            // First vertex selection
            this.currentPath.push(vertexId);
            this.selectedVertex = vertexId;
            this.pathHistory.push([...this.currentPath]);
            this.startAutoCompleteTimer();
        } else {
            const lastVertex = this.currentPath[this.currentPath.length - 1];
            
            // Check if edge exists
            if (this.adjacencyMatrix[lastVertex][vertexId] === 1) {
                // Check if completing a cycle
                if (vertexId === this.currentPath[0] && this.currentPath.length > 2) {
                    this.currentPath.push(vertexId);
                    this.pathHistory.push([...this.currentPath]);
                    document.getElementById('checkBtn').disabled = false;
                    document.getElementById('undoBtn').disabled = false;
                    this.clearAutoCompleteTimer();
                    this.checkCycle(); // Auto-check when cycle is completed
                } else if (!this.currentPath.includes(vertexId)) {
                    // Add new vertex to path
                    this.currentPath.push(vertexId);
                    this.selectedVertex = vertexId;
                    this.pathHistory.push([...this.currentPath]);
                    document.getElementById('undoBtn').disabled = false;
                    this.resetAutoCompleteTimer();
                } else if (vertexId === this.currentPath[0]) {
                    // Trying to close cycle too early
                    this.showFeedback(false, 'Cannot close cycle yet - need to visit more vertices!');
                    return;
                } else {
                    // Trying to revisit a vertex (not allowed in Hamiltonian)
                    if (this.currentMode === 'hamiltonian' || this.currentMode === 'tsp') {
                        this.showFeedback(false, 'Cannot revisit vertices in Hamiltonian cycles!');
                        return;
                    } else {
                        // For Eulerian, allow revisiting vertices
                        this.currentPath.push(vertexId);
                        this.selectedVertex = vertexId;
                        this.pathHistory.push([...this.currentPath]);
                        document.getElementById('undoBtn').disabled = false;
                        this.resetAutoCompleteTimer();
                    }
                }
            } else {
                this.showFeedback(false, 'No edge exists between these vertices!');
                return;
            }
        }
        
        this.updatePathDisplay();
        this.draw();
    }
    
    startAutoCompleteTimer() {
        this.clearAutoCompleteTimer();
        // Auto-complete after 30 seconds of inactivity
        this.autoCompleteTimeout = setTimeout(() => {
            this.autoComplete();
        }, 30000);
    }
    
    resetAutoCompleteTimer() {
        this.startAutoCompleteTimer();
    }
    
    clearAutoCompleteTimer() {
        if (this.autoCompleteTimeout) {
            clearTimeout(this.autoCompleteTimeout);
            this.autoCompleteTimeout = null;
        }
    }
    
    autoComplete() {
        if (this.isCompleted || !this.currentMode) return;
        
        this.clearAutoCompleteTimer();
        
        let message = '';
        let isCorrect = false;
        
        switch (this.currentMode) {
            case 'hamiltonian':
                const hamiltonianCycle = this.findHamiltonianCycle();
                if (hamiltonianCycle) {
                    this.currentPath = hamiltonianCycle;
                    message = 'Auto-completed: Valid Hamiltonian cycle found!';
                    isCorrect = true;
                } else {
                    message = 'Auto-completed: No Hamiltonian cycle exists in this graph.';
                }
                break;
                
            case 'eulerian':
                if (this.checkEulerianPossible()) {
                    const eulerianCycle = this.findEulerianCycle();
                    if (eulerianCycle) {
                        this.currentPath = eulerianCycle;
                        message = 'Auto-completed: Valid Eulerian cycle found!';
                        isCorrect = true;
                    } else {
                        message = 'Auto-completed: Could not find Eulerian cycle.';
                    }
                } else {
                    message = 'Auto-completed: No Eulerian cycle possible (odd degree vertices exist).';
                }
                break;
                
            case 'tsp':
                const tspCycle = this.findTSPCycle();
                if (tspCycle) {
                    this.currentPath = tspCycle.path;
                    message = `Auto-completed: TSP cycle found with weight ${tspCycle.weight}!`;
                    isCorrect = true;
                } else {
                    message = 'Auto-completed: No TSP cycle found.';
                }
                break;
        }
        
        this.isCompleted = true;
        this.showFeedback(isCorrect, message);
        this.updatePathDisplay();
        this.draw();
        
        // Reset after showing result
        setTimeout(() => {
            this.resetForNewAttempt();
        }, 3000);
    }
    
    findHamiltonianCycle() {
        // Simple backtracking algorithm for small graphs
        const visited = new Array(this.vertexCount).fill(false);
        const path = [];
        
        const backtrack = (vertex, count) => {
            visited[vertex] = true;
            path.push(vertex);
            
            if (count === this.vertexCount) {
                // Check if we can return to start
                if (this.adjacencyMatrix[vertex][path[0]] === 1) {
                    path.push(path[0]);
                    return true;
                }
            } else {
                // Try all adjacent vertices
                for (let next = 0; next < this.vertexCount; next++) {
                    if (!visited[next] && this.adjacencyMatrix[vertex][next] === 1) {
                        if (backtrack(next, count + 1)) {
                            return true;
                        }
                    }
                }
            }
            
            visited[vertex] = false;
            path.pop();
            return false;
        };
        
        // Try starting from vertex 0
        if (backtrack(0, 1)) {
            return [...path];
        }
        
        return null;
    }
    
    findEulerianCycle() {
        if (!this.checkEulerianPossible()) return null;
        
        // Hierholzer's algorithm simplified
        const adjList = Array(this.vertexCount).fill().map(() => []);
        
        // Build adjacency list with edge tracking
        for (let edge of this.edges) {
            adjList[edge.v1].push(edge.v2);
            adjList[edge.v2].push(edge.v1);
        }
        
        const circuit = [];
        const stack = [0]; // Start from vertex 0
        
        while (stack.length > 0) {
            const v = stack[stack.length - 1];
            
            if (adjList[v].length > 0) {
                const u = adjList[v].pop();
                // Remove reverse edge
                const index = adjList[u].indexOf(v);
                if (index > -1) {
                    adjList[u].splice(index, 1);
                }
                stack.push(u);
            } else {
                circuit.push(stack.pop());
            }
        }
        
        return circuit.reverse();
    }
    
    findTSPCycle() {
        // Brute force for small graphs (find shortest Hamiltonian cycle)
        const hamiltonianCycle = this.findHamiltonianCycle();
        if (!hamiltonianCycle) return null;
        
        let bestCycle = hamiltonianCycle;
        let bestWeight = this.calculateCycleWeight(hamiltonianCycle);
        
        // Try a few permutations to find a better solution
        const permutations = this.generatePermutations(Array.from({length: this.vertexCount}, (_, i) => i));
        
        for (let perm of permutations.slice(0, 120)) { // Limit to avoid timeout
            const cycle = [...perm, perm[0]];
            if (this.isValidCycle(cycle)) {
                const weight = this.calculateCycleWeight(cycle);
                if (weight < bestWeight) {
                    bestWeight = weight;
                    bestCycle = cycle;
                }
            }
        }
        
        return { path: bestCycle, weight: bestWeight };
    }
    
    generatePermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
            const permutations = this.generatePermutations(remaining);
            
            for (let perm of permutations) {
                result.push([current].concat(perm));
            }
        }
        
        return result;
    }
    
    isValidCycle(cycle) {
        for (let i = 0; i < cycle.length - 1; i++) {
            if (this.adjacencyMatrix[cycle[i]][cycle[i + 1]] === 0) {
                return false;
            }
        }
        return true;
    }
    
    calculateCycleWeight(cycle) {
        let weight = 0;
        for (let i = 0; i < cycle.length - 1; i++) {
            weight += this.edgeWeights[cycle[i]][cycle[i + 1]];
        }
        return weight;
    }
    
    resetForNewAttempt() {
        this.currentPath = [];
        this.pathHistory = [];
        this.selectedVertex = null;
        this.isCompleted = false;
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
        this.hideFeedback();
        this.updatePathDisplay();
        this.draw();
    }
    
    draw() {
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Clear canvas
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw edges
        this.drawEdges();
        
        // Draw vertices
        this.drawVertices();
        
        // Draw mode indicator
        this.drawModeIndicator();
    }
    
    drawEdges() {
        this.ctx.lineWidth = 2;
        
        for (let edge of this.edges) {
            const v1 = this.vertices[edge.v1];
            const v2 = this.vertices[edge.v2];
            
            // Check if edge is in current path
            const isInPath = this.isEdgeInPath(edge.v1, edge.v2);
            this.ctx.strokeStyle = isInPath ? this.colors.pathEdge : this.colors.edge;
            
            this.ctx.beginPath();
            this.ctx.moveTo(v1.x, v1.y);
            this.ctx.lineTo(v2.x, v2.y);
            this.ctx.stroke();
            
            // Draw weight for TSP mode
            if (this.currentMode === 'tsp') {
                const midX = (v1.x + v2.x) / 2;
                const midY = (v1.y + v2.y) / 2;
                
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(midX - 8, midY - 8, 16, 16);
                this.ctx.strokeStyle = this.colors.edge;
                this.ctx.strokeRect(midX - 8, midY - 8, 16, 16);
                
                this.ctx.fillStyle = '#374151';
                this.ctx.font = 'bold 10px Poppins';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(edge.weight.toString(), midX, midY);
            }
        }
    }
    
    drawVertices() {
        for (let vertex of this.vertices) {
            let fillColor = this.colors.vertex;
            
            if (this.currentPath.includes(vertex.id)) {
                fillColor = this.colors.pathVertex;
            }
            if (vertex.id === this.selectedVertex) {
                fillColor = this.colors.selectedVertex;
            }
            
            // Draw vertex shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(vertex.x + 2, vertex.y + 2, this.vertexRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw vertex
            this.ctx.fillStyle = fillColor;
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, this.vertexRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#374151';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw vertex label
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Poppins';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(vertex.label, vertex.x, vertex.y);
        }
    }
    
    drawModeIndicator() {
        if (!this.currentMode) return;
        
        const modeNames = {
            'hamiltonian': 'Hamiltonian Cycle',
            'eulerian': 'Eulerian Cycle',
            'tsp': 'TSP Cycle'
        };
        
        const modeColors = {
            'hamiltonian': '#22c55e',
            'eulerian': '#3b82f6',
            'tsp': '#8b5cf6'
        };
        
        this.ctx.fillStyle = modeColors[this.currentMode];
        this.ctx.font = 'bold 16px Poppins';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Mode: ${modeNames[this.currentMode]}`, 10, 10);
    }
    
    isEdgeInPath(v1, v2) {
        for (let i = 0; i < this.currentPath.length - 1; i++) {
            const pathV1 = this.currentPath[i];
            const pathV2 = this.currentPath[i + 1];
            if ((pathV1 === v1 && pathV2 === v2) || (pathV1 === v2 && pathV2 === v1)) {
                return true;
            }
        }
        return false;
    }
    
    startHamiltonian() {
        this.currentMode = 'hamiltonian';
        this.currentPath = [];
        this.pathHistory = [];
        this.selectedVertex = null;
        this.isCompleted = false;
        this.clearAutoCompleteTimer();
        document.getElementById('challengeQuestion').textContent = 
            'Find a Hamiltonian cycle: Visit every vertex exactly once and return to start.';
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
        this.hideFeedback();
        this.updatePathDisplay();
        this.draw();
    }
    
    startEulerian() {
        this.currentMode = 'eulerian';
        this.currentPath = [];
        this.pathHistory = [];
        this.selectedVertex = null;
        this.isCompleted = false;
        this.clearAutoCompleteTimer();
        
        // Check if Eulerian cycle is possible
        const hasEulerianCycle = this.checkEulerianPossible();
        
        if (hasEulerianCycle) {
            document.getElementById('challengeQuestion').textContent = 
                'Find an Eulerian cycle: Traverse every edge exactly once and return to start.';
        } else {
            document.getElementById('challengeQuestion').textContent = 
                'This graph has no Eulerian cycle (not all vertices have even degree).';
        }
        
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
        this.hideFeedback();
        this.updatePathDisplay();
        this.draw();
    }
    
    startTSP() {
        this.currentMode = 'tsp';
        this.currentPath = [];
        this.pathHistory = [];
        this.selectedVertex = null;
        this.isCompleted = false;
        this.clearAutoCompleteTimer();
        document.getElementById('challengeQuestion').textContent = 
            'Find the shortest Hamiltonian cycle (TSP): Minimize total edge weight.';
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
        this.hideFeedback();
        this.updatePathDisplay();
        this.draw();
    }
    
    checkEulerianPossible() {
        for (let i = 0; i < this.vertexCount; i++) {
            let degree = 0;
            for (let j = 0; j < this.vertexCount; j++) {
                degree += this.adjacencyMatrix[i][j];
            }
            if (degree % 2 !== 0) {
                return false;
            }
        }
        return true;
    }
    
    validateTSP() {
        // Must be a valid Hamiltonian cycle first
        if (!this.validateHamiltonian()) {
            return false;
        }
        
        // Check if this is the optimal path
        const currentWeight = this.calculatePathWeight();
        const optimalTSP = this.findTSPCycle();
        
        if (optimalTSP && currentWeight > optimalTSP.weight) {
            // Store the feedback for later use
            this.tspFeedback = `Your path weight is ${currentWeight}, but a better path with weight ${optimalTSP.weight} exists. Try again!`;
            return false;
        }
        
        return true;
    }
    
    checkCycle() {
        if (this.isCompleted) return;
        
        this.clearAutoCompleteTimer();
        
        if (this.currentPath.length < 3) {
            this.showFeedback(false, 'A cycle must have at least 3 vertices!');
            setTimeout(() => this.resetForNewAttempt(), 2000);
            return;
        }
        
        // Check if path forms a cycle
        if (this.currentPath[0] !== this.currentPath[this.currentPath.length - 1]) {
            this.showFeedback(false, 'Path must return to starting vertex!');
            setTimeout(() => this.resetForNewAttempt(), 2000);
            return;
        }
        
        let isValid = false;
        let message = '';
        
        switch (this.currentMode) {
            case 'hamiltonian':
                isValid = this.validateHamiltonian();
                message = isValid ? 'Valid Hamiltonian cycle!' : 'Invalid Hamiltonian cycle - must visit each vertex exactly once!';
                break;
            case 'eulerian':
                isValid = this.validateEulerian();
                message = isValid ? 'Valid Eulerian cycle!' : 'Invalid Eulerian cycle - must traverse each edge exactly once!';
                break;
            case 'tsp':
                isValid = this.validateTSP();
                if (isValid) {
                    const weight = this.calculatePathWeight();
                    message = `Optimal TSP cycle found! Total weight: ${weight}`;
                } else if (this.tspFeedback) {
                    message = this.tspFeedback;
                    this.tspFeedback = null; // Clear after use
                } else {
                    message = 'Invalid TSP cycle - must be a valid Hamiltonian cycle!';
                }
                break;
        }
        
        this.isCompleted = true;
        this.showFeedback(isValid, message);
        
        // Reset after showing result
        setTimeout(() => {
            this.resetForNewAttempt();
        }, 3000);
    }
    
    undoLastMove() {
        if (this.pathHistory.length <= 1) {
            return; // Cannot undo if no moves or only initial move
        }
        
        // Remove the current state
        this.pathHistory.pop();
        
        // Restore previous state
        if (this.pathHistory.length > 0) {
            this.currentPath = [...this.pathHistory[this.pathHistory.length - 1]];
        } else {
            this.currentPath = [];
        }
        
        // Update selected vertex
        if (this.currentPath.length > 0) {
            this.selectedVertex = this.currentPath[this.currentPath.length - 1];
        } else {
            this.selectedVertex = null;
        }
        
        // Update UI state
        if (this.pathHistory.length <= 1) {
            document.getElementById('undoBtn').disabled = true;
        }
        
        if (this.currentPath.length <= 2) {
            document.getElementById('checkBtn').disabled = true;
        }
        
        this.updatePathDisplay();
        this.draw();
    }
    
    validateHamiltonian() {
        // Must visit each vertex exactly once (except start/end)
        const uniqueVertices = new Set(this.currentPath.slice(0, -1));
        return uniqueVertices.size === this.vertexCount;
    }
    
    validateEulerian() {
        // Must traverse each edge exactly once
        const usedEdges = new Set();
        
        for (let i = 0; i < this.currentPath.length - 1; i++) {
            const v1 = this.currentPath[i];
            const v2 = this.currentPath[i + 1];
            const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
            
            if (usedEdges.has(edgeKey)) {
                return false; // Edge used twice
            }
            usedEdges.add(edgeKey);
        }
        
        return usedEdges.size === this.edges.length;
    }
    
    validateTSP() {
        // Must be a valid Hamiltonian cycle first
        if (!this.validateHamiltonian()) {
            return false;
        }
        
        // Check if this is the optimal path
        const currentWeight = this.calculatePathWeight();
        const optimalTSP = this.findTSPCycle();
        
        if (optimalTSP && currentWeight > optimalTSP.weight) {
            // Store the feedback for later use
            this.tspFeedback = `Your path weight is ${currentWeight}, but a better path with weight ${optimalTSP.weight} exists. Try again!`;
            return false;
        }
        
        return true;
    }
    
    calculatePathWeight() {
        let totalWeight = 0;
        for (let i = 0; i < this.currentPath.length - 1; i++) {
            const v1 = this.currentPath[i];
            const v2 = this.currentPath[i + 1];
            totalWeight += this.edgeWeights[v1][v2];
        }
        return totalWeight;
    }
    
    clearPath() {
        this.currentPath = [];
        this.pathHistory = [];
        this.selectedVertex = null;
        this.isCompleted = false;
        this.clearAutoCompleteTimer();
        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
        this.hideFeedback();
        this.updatePathDisplay();
        this.draw();
    }
    
    updatePathDisplay() {
        const pathElement = document.getElementById('currentPath');
        const pathDisplay = document.getElementById('pathDisplay');
        
        if (this.currentPath.length === 0) {
            pathDisplay.classList.add('hidden');
            return;
        }
        
        pathDisplay.classList.remove('hidden');
        const pathLabels = this.currentPath.map(id => this.vertices[id].label);
        pathElement.textContent = pathLabels.join(' → ');
    }
    
    showFeedback(isCorrect, message) {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.classList.remove('hidden', 'bg-green-100', 'bg-red-100', 'text-green-800', 'text-red-800');
        
        if (isCorrect) {
            feedbackElement.classList.add('bg-green-100', 'text-green-800');
        } else {
            feedbackElement.classList.add('bg-red-100', 'text-red-800');
        }
        
        feedbackElement.textContent = message;
    }
    
    hideFeedback() {
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.classList.add('hidden');
    }
    
    updateGraphInfo() {
        document.getElementById('vertexCount').textContent = this.vertexCount;
        document.getElementById('edgeCount').textContent = this.edges.length;
        
        // Calculate degree sequence
        const degrees = [];
        for (let i = 0; i < this.vertexCount; i++) {
            let degree = 0;
            for (let j = 0; j < this.vertexCount; j++) {
                degree += this.adjacencyMatrix[i][j];
            }
            degrees.push(degree);
        }
        degrees.sort((a, b) => b - a);
        document.getElementById('degreeSequence').textContent = degrees.join(', ');
    }
    
    updateVertexCount() {
        const slider = document.getElementById('vertexCountSlider');
        this.vertexCount = parseInt(slider.value);
        document.getElementById('vertexCountValue').textContent = this.vertexCount;
        this.generateGraph();
    }
    
    updateEdgeDensity() {
        const slider = document.getElementById('edgeDensitySlider');
        this.edgeDensity = parseFloat(slider.value);
        document.getElementById('edgeDensityValue').textContent = this.edgeDensity;
        this.generateGraph();
    }
    
    ensureEvenDegrees() {
        let safetyCounter = 0;
        const maxIterations = this.vertexCount * 2; // A safe limit to prevent infinite loops

        while (safetyCounter < maxIterations) {
            const oddVertices = [];
            // Find all vertices with an odd degree
            for (let i = 0; i < this.vertexCount; i++) {
                const degree = this.adjacencyMatrix[i].reduce((sum, val) => sum + val, 0);
                if (degree % 2 !== 0) {
                    oddVertices.push(i);
                }
            }

            // If no vertices have an odd degree, we are done
            if (oddVertices.length === 0) {
                return;
            }

            // The number of odd-degree vertices is always even.
            // Find the first pair of non-connected odd vertices and add an edge.
            let edgeAdded = false;
            for (let i = 0; i < oddVertices.length; i++) {
                for (let j = i + 1; j < oddVertices.length; j++) {
                    const v1 = oddVertices[i];
                    const v2 = oddVertices[j];
                    if (this.adjacencyMatrix[v1][v2] === 0) {
                        this.addEdge(v1, v2);
                        edgeAdded = true;
                        break;
                    }
                }
                if (edgeAdded) {
                    break;
                }
            }

            if (!edgeAdded) {
                // This is a rare edge case where all odd-degree vertices are already
                // connected to each other (forming a clique). The simple algorithm
                // cannot proceed. We can just stop here.
                console.warn("Could not make the graph Eulerian as odd-degree vertices form a clique.");
                return;
            }

            safetyCounter++;
        }
    }
}

// Global game instance
let graphGame;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    graphGame = new GraphCycles();
    
    // Update the initial slider values
    const vertexCountSlider = document.getElementById('vertexCountSlider');
    const edgeDensitySlider = document.getElementById('edgeDensitySlider');
    
    if (vertexCountSlider) {
        vertexCountSlider.value = graphGame.vertexCount;
        document.getElementById('vertexCountValue').textContent = graphGame.vertexCount;
    }
    
    if (edgeDensitySlider) {
        edgeDensitySlider.value = graphGame.edgeDensity;
        document.getElementById('edgeDensityValue').textContent = graphGame.edgeDensity;
    }
});

// Control functions
function updateVertexCount() {
    if (graphGame) {
        graphGame.updateVertexCount();
    }
}

function updateEdgeDensity() {
    if (graphGame) {
        graphGame.updateEdgeDensity();
    }
}

function generateNewGraph() {
    if (graphGame) {
        graphGame.generateGraph();
    }
}

function startHamiltonian() {
    if (graphGame) {
        graphGame.startHamiltonian();
    }
}

function startEulerian() {
    if (graphGame) {
        graphGame.startEulerian();
    }
}

function startTSP() {
    if (graphGame) {
        graphGame.startTSP();
    }
}

function clearPath() {
    if (graphGame) {
        graphGame.clearPath();
    }
}

function checkCycle() {
    if (graphGame) {
        graphGame.checkCycle();
    }
}

function undoLastMove() {
    if (graphGame) {
        graphGame.undoLastMove();
    }
}

// Floating Panel Controls
document.addEventListener('DOMContentLoaded', function() {
    // Controls panel
    const controlsButton = document.getElementById('controlsButton');
    const controlsPanel = document.getElementById('controlsPanel');
    const controlsPanelClose = document.getElementById('controlsPanelClose');
    
    // Info panel
    const infoButton = document.getElementById('infoButton');
    const infoPanel = document.getElementById('infoPanel');
    const infoPanelClose = document.getElementById('infoPanelClose');
    
    // Panel toggle functions
    function togglePanel(panel, button, otherPanel) {
        const isActive = panel.classList.contains('active');
        // Close other panel if active
        if (otherPanel && otherPanel.classList.contains('active')) {
            otherPanel.classList.remove('active');
        }
        // Toggle current panel
        if (isActive) {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
            button.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                button.style.transform = '';
            }, 300);
        }
    }
    
    // Control panel events
    if (controlsButton) {
        controlsButton.addEventListener('click', function() {
            togglePanel(controlsPanel, controlsButton, infoPanel);
        });
    }
    
    if (controlsPanelClose) {
        controlsPanelClose.addEventListener('click', function() {
            controlsPanel.classList.remove('active');
        });
    }
    
    // Info panel events
    if (infoButton) {
        infoButton.addEventListener('click', function() {
            togglePanel(infoPanel, infoButton, controlsPanel);
        });
    }
    
    if (infoPanelClose) {
        infoPanelClose.addEventListener('click', function() {
            infoPanel.classList.remove('active');
        });
    }
    
    // Close panels when clicking outside
    document.addEventListener('click', function(event) {
        if (controlsPanel && !controlsPanel.contains(event.target) && 
            controlsButton && !controlsButton.contains(event.target) && 
            controlsPanel.classList.contains('active')) {
            controlsPanel.classList.remove('active');
        }
        if (infoPanel && !infoPanel.contains(event.target) && 
            infoButton && !infoButton.contains(event.target) && 
            infoPanel.classList.contains('active')) {
            infoPanel.classList.remove('active');
        }
    });
});