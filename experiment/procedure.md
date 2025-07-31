# Objective

This interactive experiment introduces you to fundamental concepts in graph theory through engaging, hands-on exploration. You will master three important types of cycles in graphs while developing problem-solving skills that are essential in computer science, mathematics, and real-world applications.

## Learning Goals

By the end of this experiment, you will be able to:

- **Identify and construct Hamiltonian cycles** - paths that visit every vertex exactly once
- **Recognize and validate Eulerian cycles** - paths that traverse every edge exactly once
- **Solve the Traveling Salesman Problem (TSP)** - finding the shortest route through all vertices
- **Understand the theoretical foundations** behind these classical graph problems

---

## Getting Started

### Interface Overview

The simulation provides an intuitive visual interface with several key components:

1. **Interactive Graph Canvas**: A circular arrangement of labeled vertices (A, B, C, etc.) connected by edges
2. **Challenge Selector**: Dropdown menu to choose between Hamiltonian, Eulerian, and TSP challenges
3. **Control Buttons**: Tools for managing your exploration (New Graph, Clear Path, Undo, Check Cycle)
4. **Floating Panels**:
   - **Graph Parameters Panel** (gear icon): Adjust vertex count (4-8) and edge density (0.3-0.9)
   - **Information Panel** (info icon): Quick reference for cycle types and their properties
5. **Feedback System**: Real-time guidance and validation of your solutions

### Basic Interaction

- **Click vertices** to build your path step by step
- **Follow the visual feedback** - selected vertices turn red, path vertices turn green
- **Monitor your progress** in the current path display
- **Use undo** to backtrack if you make a mistake

---

## Experiment Procedures

### Task 1: Mastering Hamiltonian Cycles

**Objective**: Learn to identify and construct paths that visit every vertex exactly once.

#### Step 1: Setup and Understanding

1. **Select the challenge**: Choose "Find Hamiltonian Cycle" from the dropdown menu
2. **Read the prompt**: Notice the challenge description updates to guide you
3. **Observe the graph**: Study the vertex arrangement (A, B, C, D, E, F) and edge connections
4. **Check the information panel**: Review Hamiltonian cycle properties if needed

#### Step 2: Strategy Development

1. **Count the vertices**: Note how many vertices need to be visited (typically 6)
2. **Identify potential starting points**: Any vertex can serve as a starting point
3. **Look for dead ends**: Identify vertices with only one or two connections
4. **Plan your route**: Consider which path might allow you to visit all vertices

#### Step 3: Interactive Construction

1. **Start your cycle**: Click any vertex to begin (it will turn red)
2. **Build your path**:
   - Click adjacent vertices to extend your path
   - Watch as selected vertices turn green
   - The current path displays at the top
3. **Handle feedback**:
   - Red error messages indicate invalid moves (no edge exists, vertex already visited)
   - Continue building until you can return to your starting vertex
4. **Complete the cycle**: Click your starting vertex again to close the cycle

#### Step 4: Validation and Learning

1. **Automatic checking**: The system validates your cycle automatically upon completion
2. **Interpret results**:
   - ✅ **Success**: "Valid Hamiltonian cycle!" - you've found a correct solution
   - ❌ **Error**: "Invalid Hamiltonian cycle" - review what went wrong
3. **Try the undo feature**: Practice backtracking using the Undo button
4. **Experiment further**: Use "Clear Path" to try different approaches

#### Step 5: Advanced Exploration

1. **Generate new graphs**: Click "New Graph" to practice with different structures
2. **Adjust difficulty**: Use the parameters panel to:
   - Increase vertex count (more challenging)
   - Adjust edge density (affects solution availability)
3. **Challenge yourself**: Try to find Hamiltonian cycles in graphs with fewer edges

---

### Task 2: Exploring Eulerian Cycles

**Objective**: Understand paths that traverse every edge exactly once.

#### Step 1: Theory Application

1. **Select Eulerian mode**: Choose "Find Eulerian Cycle" from the dropdown
2. **Check vertex degrees**: Open the Graph Parameters panel to view degree sequence
3. **Apply Euler's theorem**:
   - An Eulerian cycle exists **only if** all vertices have even degree
   - If any vertex has odd degree, no Eulerian cycle is possible

#### Step 2: Feasibility Analysis

1. **Examine the feedback**: The system will indicate if an Eulerian cycle is possible
2. **If possible**: Proceed to construct the cycle
3. **If impossible**: The system explains why (odd degree vertices exist)
4. **Generate new graphs** until you find one with all even-degree vertices

#### Step 3: Cycle Construction (for valid graphs)

1. **Start at any vertex**: Unlike Hamiltonian cycles, starting point doesn't matter
2. **Traverse edges systematically**:
   - Click vertices to move along edges
   - **Key difference**: You may revisit vertices, but never reuse edges
   - Track your progress - each edge should be used exactly once
3. **Plan carefully**: Avoid getting trapped with no way to return to start

#### Step 4: Validation Process

1. **Complete the cycle**: Return to your starting vertex
2. **System validation**: Checks that every edge was used exactly once
3. **Learn from mistakes**: If invalid, consider which edges were missed or repeated

---

### Task 3: Solving the Traveling Salesman Problem

**Objective**: Find the shortest Hamiltonian cycle by minimizing total edge weights.

#### Step 1: Understanding Weighted Graphs

1. **Select TSP mode**: Choose "Find TSP Cycle" from the dropdown
2. **Observe edge weights**: White squares on edges show numerical weights (1-9)
3. **Understand the goal**: Find a Hamiltonian cycle with minimum total weight

#### Step 2: Strategic Planning

1. **Identify heavy edges**: Note which edges have high weights to avoid
2. **Look for light edges**: Prioritize paths using low-weight edges
3. **Consider trade-offs**: Sometimes a longer path with lighter edges is better

#### Step 3: Solution Construction

1. **Build a Hamiltonian cycle**: First ensure you visit all vertices exactly once
2. **Calculate as you go**: Mental math helps - add edge weights in your path
3. **Compare alternatives**: Try different routes to find the optimal solution

#### Step 4: Optimization and Validation

1. **Submit your solution**: Complete the cycle and let the system check it
2. **Interpret feedback**:
   - **Optimal**: "Optimal TSP cycle found! Total weight: X"
   - **Suboptimal**: "Your path weight is X, but a better path with weight Y exists"
3. **Iterative improvement**: Use the feedback to find better solutions

---

## Advanced Features and Tips

### Utilizing the Auto-Complete Feature

- **Automatic assistance**: After 30 seconds of inactivity, the system provides solutions
- **Learning opportunity**: Compare your approach with the automated solution
- **Don't rely on it**: Try to solve problems independently first

### Parameter Experimentation

1. **Vertex count effects**:
   - **4 vertices**: Simple, good for learning basics
   - **6 vertices**: Standard difficulty, balanced complexity
   - **8 vertices**: Advanced, requires careful planning

2. **Edge density impact**:
   - **Low density (0.3)**: Fewer solutions, more challenging
   - **High density (0.9)**: Multiple solutions, easier to find cycles

### Problem-Solving Strategies

#### For Hamiltonian Cycles

- Start with vertices that have few connections
- Avoid creating "islands" of unvisited vertices
- Use systematic exploration rather than random clicking

#### For Eulerian Cycles

- Check degree parity first - don't waste time on impossible graphs
- Follow a methodical path to avoid missing edges
- Remember: vertex revisiting is allowed, edge reuse is not

#### For TSP

- Use a greedy approach initially (choose lightest available edges)
- Consider the "nearest neighbor" heuristic
- Remember that the globally optimal solution may require some heavier local choices
