#[derive(Debug)]
pub enum Direction {
    Up,
    Down,
    Left,
    Right,
}

#[derive(Debug)]
struct Position {
    x: isize,
    y: isize,
}

pub type Grid = Vec<Vec<char>>;

pub fn is_valid_solution(level_grid: &mut Grid, dirs: &Vec<Direction>) -> bool {
    let mut pos = find_player_pos(&level_grid);

    let initial_boxes_num = level_grid
        .iter()
        .flatten()
        .filter(|ch| **ch == '*' || **ch == '$')
        .collect::<Vec<_>>()
        .len();

    for dir in dirs {
        let (dx, dy) = match dir {
            Direction::Up => (0, -1),
            Direction::Down => (0, 1),
            Direction::Left => (-1, 0),
            Direction::Right => (1, 0),
        };

        move_player(level_grid, &mut pos, dx, dy);
    }

    let placed_boxes_num = level_grid
        .iter()
        .flatten()
        .filter(|ch| **ch == '*')
        .collect::<Vec<_>>()
        .len();

    initial_boxes_num == placed_boxes_num
}

fn move_player(level_grid: &mut Grid, pos: &mut Position, dx: isize, dy: isize) {
    let Some(valid_move) = is_valid_move(&level_grid, &pos, dx, dy) else {
        return;
    };

    if !valid_move {
        return;
    }

    let (new_x, new_y) = (pos.x + dx, pos.y + dy);

    let Some(tile_to_move_to) = get2d(level_grid, new_y, new_x) else {
        return;
    };

    let prev_tile = level_grid[pos.y as usize][pos.x as usize];
    let is_on_goal = prev_tile == '+';

    // set previous (or current) tile first
    if is_on_goal {
        level_grid[pos.y as usize][pos.x as usize] = '.'
    } else {
        level_grid[pos.y as usize][pos.x as usize] = ' '
    }

    // update position
    pos.x = new_x;
    pos.y = new_y;

    // floor
    if tile_to_move_to == ' ' {
        set2d(level_grid, '@', new_y, new_x);

        return;
    }

    // goal
    if tile_to_move_to == '.' {
        set2d(level_grid, '+', new_y, new_x);

        return;
    }

    let (tile_next_to_move_to_tile_x, tile_next_to_move_to_tile_y) = match (dx, dy) {
        (0, 1) => (new_x, new_y + 1),
        (0, -1) => (new_x, new_y - 1),
        (1, 0) => (new_x + 1, new_y),
        (-1, 0) => (new_x - 1, new_y),
        _ => panic!("まさか"),
    };

    let level_grid_len = level_grid.len() as isize;

    if tile_next_to_move_to_tile_x < 0
        || tile_next_to_move_to_tile_y < 0
        || tile_next_to_move_to_tile_y >= level_grid_len
    {
        return;
    }

    let (tile_next_to_move_to_tile_x, tile_next_to_move_to_tile_y) = (
        tile_next_to_move_to_tile_x as usize,
        tile_next_to_move_to_tile_y as usize,
    );

    let level_grid_row_len = level_grid[tile_next_to_move_to_tile_y].len();

    if tile_next_to_move_to_tile_x >= level_grid_row_len {
        return;
    }

    let tile_next_to_move_to_tile =
        level_grid[tile_next_to_move_to_tile_y][tile_next_to_move_to_tile_x];

    // box
    if tile_to_move_to == '$' {
        set2d(level_grid, '@', new_y, new_x);
        // place box on goal
        if tile_next_to_move_to_tile == '.' {
            level_grid[tile_next_to_move_to_tile_y][tile_next_to_move_to_tile_x] = '*';
        }

        // move box
        if tile_next_to_move_to_tile == ' ' {
            level_grid[tile_next_to_move_to_tile_y][tile_next_to_move_to_tile_x] = '$';
        }
    }

    // placed-box
    if tile_to_move_to == '*' {
        set2d(level_grid, '+', new_y, new_x);
        // un-placing from goal
        if tile_next_to_move_to_tile == ' ' {
            level_grid[tile_next_to_move_to_tile_y][tile_next_to_move_to_tile_x] = '$'
        }

        // placing on a connected goal
        if tile_next_to_move_to_tile == '.' {
            level_grid[tile_next_to_move_to_tile_y][tile_next_to_move_to_tile_x] = '*'
        }
    }
}

fn find_player_pos(level: &Grid) -> Position {
    let mut pos = Position { x: 0, y: 0 };

    for y in 0..level.len() {
        for x in 0..level[y].len() {
            if level[y][x] == '@' || level[y][x] == '+' {
                pos.x = x as isize;
                pos.y = y as isize;
                break;
            }
        }
    }

    pos
}

fn is_valid_move(grid: &Grid, pos: &Position, dx: isize, dy: isize) -> Option<bool> {
    let new_x = pos.x + dx;
    let new_y = pos.y + dy;

    let Some(tile_to_move_to) = get2d(&grid, new_y, new_x) else {
        return None;
    };

    // floor or goal is okay
    if tile_to_move_to == ' ' || tile_to_move_to == '.' {
        return Some(true);
    }

    // wall
    if tile_to_move_to == '#' {
        return Some(false);
    }

    // box
    if tile_to_move_to == '$' || tile_to_move_to == '*' {
        let tile_next_to_move_to_tile = match (dx, dy) {
            (0, 1) => get2d(grid, new_y + 1, new_x),
            (0, -1) => get2d(grid, new_y - 1, new_x),
            (1, 0) => get2d(grid, new_y, new_x + 1),
            (-1, 0) => get2d(grid, new_y, new_x - 1),
            _ => None,
        };

        let Some(tile_next_to_move_to_tile) = tile_next_to_move_to_tile else {
            return None;
        };

        // box or placed-box
        if tile_next_to_move_to_tile == '$'
            || tile_next_to_move_to_tile == '*'
            || tile_next_to_move_to_tile == '#'
        {
            return Some(false);
        }

        return Some(true);
    }

    Some(true)
}

fn get2d(grid: &Grid, y: isize, x: isize) -> Option<char> {
    let grid_len = grid.len() as isize;

    if x < 0 || y < 0 || y >= grid_len {
        return None;
    }

    if x as usize >= grid[y as usize].len() {
        return None;
    }

    let (y, x) = (y as usize, x as usize);
    grid.get(y)?.get(x).copied()
}

fn set2d(grid: &mut Grid, value: char, y: isize, x: isize) {
    let grid_len = grid.len() as isize;

    if x < 0 || y < 0 || y >= grid_len {
        return;
    }

    if x as usize >= grid[y as usize].len() {
        return;
    }

    grid[y as usize][x as usize] = value;
}
