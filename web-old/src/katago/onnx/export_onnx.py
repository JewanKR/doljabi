import sys
import torch
import argparse
import logging
from katago.train import modelconfigs
from katago.train.load_model import load_model

logging.basicConfig(level=logging.INFO)

parser = argparse.ArgumentParser()
parser.add_argument('-checkpoint', required=True)
parser.add_argument('-output', required=True, help='저장할 .onnx 경로')
parser.add_argument('-use-swa', action="store_true", required=False)
args = vars(parser.parse_args())

# 모델 로드
model, swa_model, _ = load_model(args["checkpoint"], args["use_swa"], device="cpu", verbose=True)
export_model = swa_model if swa_model is not None else model
export_model.eval()

config = export_model.config
num_bin    = modelconfigs.get_num_bin_input_features(config)
num_global = modelconfigs.get_num_global_input_features(config)
pos_len    = export_model.pos_len

logging.info(f"bin features: {num_bin}, global features: {num_global}, pos_len: {pos_len}")

# 더미 입력 생성
# input_spatial의 첫 번째 채널(mask)은 1로 설정 (전체 보드)
dummy_spatial = torch.zeros(1, num_bin, pos_len, pos_len, dtype=torch.float32)
dummy_spatial[:, 0, :, :] = 1.0  # mask 채널을 1로
dummy_global  = torch.zeros(1, num_global, dtype=torch.float32)

# ONNX export
torch.onnx.export(
    export_model,
    (dummy_spatial, dummy_global),
    args["output"],
    opset_version=13,
    input_names=["input_spatial", "input_global"],
    output_names=["policy", "value", "miscvalue", "moremiscvalue", "ownership"],
    dynamic_axes={
        "input_spatial": {0: "batch"},
        "input_global":  {0: "batch"},
    }
)
logging.info(f"ONNX 저장 완료: {args['output']}")