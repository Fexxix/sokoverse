mod solution_checker;

use serde_json::json;
use solution_checker::is_valid_solution;
use vercel_runtime::{run, Body, Error, Request, RequestPayloadExt, Response, StatusCode};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Payload {
    level: String,
    solution: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler).await
}

pub async fn handler(req: Request) -> Result<Response<Body>, Error> {
    let payload = req.payload::<Payload>();

    return match payload {
        Ok(Some(payload)) => {
            let mut level_grid = payload
                .level
                .split("\n")
                .map(|line| line.chars().collect())
                .collect();

            let dirs = payload
                .solution
                .chars()
                .map(|dir| match dir.to_ascii_lowercase() {
                    'u' => solution_checker::Direction::Up,
                    'd' => solution_checker::Direction::Down,
                    'l' => solution_checker::Direction::Left,
                    'r' => solution_checker::Direction::Right,
                    _ => panic!("Invalid direction"),
                })
                .collect();

            let is_valid = is_valid_solution(&mut level_grid, &dirs);

            Ok(Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json")
                .body(
                    json!({
                        "isValid": is_valid,
                    })
                    .to_string()
                    .into(),
                )?)
        }
        Ok(None) => Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Content-Type", "application/json")
            .body(
                json!({
                    "error": "Invalid payload",
                })
                .to_string()
                .into(),
            )?),
        Err(_) => Ok(Response::builder()
            .status(StatusCode::BAD_REQUEST)
            .header("Content-Type", "application/json")
            .body(
                json!({
                    "error": "Invalid payload",
                })
                .to_string()
                .into(),
            )?),
    };
}
