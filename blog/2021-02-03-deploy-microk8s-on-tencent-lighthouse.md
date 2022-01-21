---
date: 2021-02-03 20:00:00
authors: [gaoliang]
tags: [kubernetes, k8s]

---

# 在腾讯云轻量应用服务器上部署 MicroK8s

[腾讯云轻量应用服务器](https://cloud.tencent.com/document/product/1207)经常促销，性价比很高，但是其不支持接入 TKE。 如果希望使用轻量应用服务器来学习 kubernetes 可以在上面自建 k8s 集群。

<!--truncate-->

> 注意：本文基于腾讯云 Ubuntu 20.04 LTS 轻量应用服务器搭建 MicroK8s, 所用版本为：1.20/stable。 您看到本文时，本文可能已过时，请以 [官方文档](https://microk8s.io/) 为准。
> 安装 MicroK8s 本身并不难，但难的是在国内网络下安装 MicroK8s，因为需要去配置各种代理或者镜像

## 0. Why MicroK8s
在服务器安装完 Ubuntu 20.04 之后，打开终端的 motd (message of the day) 中，会看到这段话：

```
 * Introducing self-healing high availability clusters in MicroK8s.
   Simple, hardened, Kubernetes for production, from RaspberryPi to DC.

     https://microk8s.io/high-availability  
```

MicroK8s 相对于其他的实现主要有以下的优势：
- 轻量：与Minikube不同，它不需要VirtualBox，因此可以在虚拟服务器上运行。
- 简单：用他们官网的话来说，that ‘just work’。
- 全面：具有Istio，Knative和Kubeflow等全面功能，非常适合学习Kubernetes。

## 1. 安装和初始化

### 通过 snap 安装 MicroK8s
参照文档
```bash
sudo snap install microk8s --classic 
```
如果是国内服务器，访问 snap 仓库的速度很慢，而且 snap 的商业模式注定了不会有镜像服务，于是我们需要给 snap 配置代理服务器

参照 snap 的[文档](https://snapcraft.io/docs/system-options)配置 proxy，然后重新安装。 注意其中代理服务器 `http://127.0.0.1:1087` 是我在服务器上启的 v2 客户端提供的 http inbound 地址，每个人可能不同。
```bash
sudo snap set system proxy.http="http://127.0.0.1:1087"
sudo snap set system proxy.https="http://127.0.0.1:1087"
sudo snap install microk8s --classic
```
然后，等着速度起飞

如果你恰巧运气不好... 代理速度也不理想，那么[这里](https://microk8s.io/docs/install-alternatives#heading--offline)还提供了离线安装的方式，我们可以把安装包 scp 到服务器上进行安装。 

### 初始化

#### 设置无需 sudo 执行 microk8s 命令
配置当前用户到 microk8s 用户组，这样就不用加 sudo 使用 microk8s 命令了
```bash
sudo usermod -a -G microk8s $USER
sudo chown -f -R $USER ~/.kube
```

#### 检查状态并等待初始化
检查 microk8s 的状态， 加参数`--wait-ready` 阻塞到初始化成功 
```
microk8s status --wait-ready
```

这一步会拉镜像，大概率国内网络又会卡住... 此时就需要给 microk8s 配置代理，或者配置镜像

1. 给 MicroK8s 配置代理的方式：
这种方式比较适合你有一个很快的代理的情况，配置一劳永逸，流程可以参考 https://microk8s.io/docs/install-proxy 主要是编辑 `/var/snap/microk8s/current/args/containerd-env` 这个文件，
```BASH
HTTPS_PROXY=https://squid.internal:3128
NO_PROXY=10.1.0.0/16,10.152.183.0/24
#
# Some additional environment variables
#
ulimit -n 65536 || true
ulimit -l 16384 || true
```
文件里有提示如何修改，然后 `microk8s stop` , `microk8s start` 重启生效

2. 修改 MicroK8s dockerhub registry 镜像的方式
如果要配置镜像，要注意本机安装的 docker 镜像配置是不生效的，因为 MicroK8s 使用的是内建的 containerd，查找文档后发现要编辑 `/var/snap/microk8s/current/args/containerd-template.toml` 这个文件

找到下面的段落，把其中的 docker.io 的地址改成可用的 dockerhub 镜像
```toml
  # 'plugins."io.containerd.grpc.v1.cri".registry' contains config related to the registry
  [plugins."io.containerd.grpc.v1.cri".registry]

    # 'plugins."io.containerd.grpc.v1.cri".registry.mirrors' are namespace to mirror mapping for all namespaces.
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"] 
        endpoint = ["https://registry-1.docker.io", ] # 修改这一行
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:32000"]
        endpoint = ["http://localhost:32000"]
```
然后需要重启microk8s, 一样还是 `microk8s stop` , `microk8s start`

配置代理或者镜像之后，不出意外，又可以起飞了，继续执行我们未完成的命令，执行成功后，终端输出如下，可以看到各种 addon 的开启状态
```
high-availability: no
  datastore master nodes: 127.0.0.1:19001
  datastore standby nodes: none
addons:
  enabled:
    ha-cluster           # Configure high availability on the current node
  disabled:
    ambassador           # Ambassador API Gateway and Ingress
    cilium               # SDN, fast with full network policy
    dashboard            # The Kubernetes dashboard
    dns                  # CoreDNS
    fluentd              # Elasticsearch-Fluentd-Kibana logging and monitoring
    gpu                  # Automatic enablement of Nvidia CUDA
    helm                 # Helm 2 - the package manager for Kubernetes
    helm3                # Helm 3 - Kubernetes package manager
    host-access          # Allow Pods connecting to Host services smoothly
    ingress              # Ingress controller for external access
    istio                # Core Istio service mesh services
    jaeger               # Kubernetes Jaeger operator with its simple config
    keda                 # Kubernetes-based Event Driven Autoscaling
    knative              # The Knative framework on Kubernetes.
    kubeflow             # Kubeflow for easy ML deployments
    linkerd              # Linkerd is a service mesh for Kubernetes and other frameworks
    metallb              # Loadbalancer for your Kubernetes cluster
    metrics-server       # K8s Metrics Server for API access to service metrics
    multus               # Multus CNI enables attaching multiple network interfaces to pods
    portainer            # Portainer UI for your Kubernetes cluster
    prometheus           # Prometheus operator for monitoring and logging
    rbac                 # Role-Based Access Control for authorisation
    registry             # Private image registry exposed on localhost:32000
    storage              # Storage class; allocates storage from host directory
    traefik              # traefik Ingress controller for external access
```
至此，环境已经初始化成功了, 可以通过 `microk8s kubectl get nodes` 和 `microk8s kubectl get services` 当前的节点和服务状态

#### 简化 kubectl 命令
默认 kubectl 访问需要带上 microk8s 前缀，可以通过配置 alias 简化命令

在 ~/.bash_aliases 中加入 `alias kubectl='microk8s kubectl'`，source 之后直接使用 kubectrl 即可


## 2.试水
kubectl 默认是最简化安装，大量的addons都没有安装，我们来尝试安装 dns 和 dashboard 组件
执行如下命令
```bash
microk8s enable dns dashboard
```

可以得到如下的输出
```
Enabling DNS
Applying manifest
serviceaccount/coredns created
configmap/coredns created
deployment.apps/coredns created
service/kube-dns created
clusterrole.rbac.authorization.k8s.io/coredns created
clusterrolebinding.rbac.authorization.k8s.io/coredns created
Restarting kubelet
DNS is enabled
Enabling Kubernetes Dashboard
Enabling Metrics-Server
clusterrole.rbac.authorization.k8s.io/system:aggregated-metrics-reader created
clusterrolebinding.rbac.authorization.k8s.io/metrics-server:system:auth-delegator created
rolebinding.rbac.authorization.k8s.io/metrics-server-auth-reader created
Warning: apiregistration.k8s.io/v1beta1 APIService is deprecated in v1.19+, unavailable in v1.22+; use apiregistration.k8s.io/v1 APIService
apiservice.apiregistration.k8s.io/v1beta1.metrics.k8s.io created
serviceaccount/metrics-server created
deployment.apps/metrics-server created
service/metrics-server created
clusterrole.rbac.authorization.k8s.io/system:metrics-server created
clusterrolebinding.rbac.authorization.k8s.io/system:metrics-server created
clusterrolebinding.rbac.authorization.k8s.io/microk8s-admin created
Metrics-Server is enabled
Applying manifest
serviceaccount/kubernetes-dashboard created
service/kubernetes-dashboard created
secret/kubernetes-dashboard-certs created
secret/kubernetes-dashboard-csrf created
secret/kubernetes-dashboard-key-holder created
configmap/kubernetes-dashboard-settings created
role.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrole.rbac.authorization.k8s.io/kubernetes-dashboard created
rolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
clusterrolebinding.rbac.authorization.k8s.io/kubernetes-dashboard created
deployment.apps/kubernetes-dashboard created
service/dashboard-metrics-scraper created
deployment.apps/dashboard-metrics-scraper created

If RBAC is not enabled access the dashboard using the default token retrieved with:

token=$(microk8s kubectl -n kube-system get secret | grep default-token | cut -d " " -f1)
microk8s kubectl -n kube-system describe secret $token

In an RBAC enabled setup (microk8s enable RBAC) you need to create a user with restricted
permissions as shown in:
https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md
```
说明组件安装成功, 然后按照输出里的提示，获取 dashboard 的登陆 token

然后，为 dashboard 设置端口转发 
```bash
kubectl port-forward -n kube-system service/kubernetes-dashboard --address=0.0.0.0 10443:443
```
此时就可以从 10443 端口访问到 dashboard 了, 不过由于是自签名的证书，可能会提示证书无效, 我们先不管他

执行`microk8s status`，可以发现刚才装上的两个组件已经处于启用状态了
```
microk8s is running
high-availability: no
  datastore master nodes: 127.0.0.1:19001
  datastore standby nodes: none
addons:
  enabled:
    dashboard            # The Kubernetes dashboard
    dns                  # CoreDNS
    ha-cluster           # Configure high availability on the current node
    metrics-server       # K8s Metrics Server for API access to service metrics
```
最后，我们部署一个应用,并查看他的状态，这里以nginx为例:
```bash
microk8s kubectl create deployment nginx --image=nginx
microk8s kubectl get pods
```
可以看到nginx已经跑起来了
```bash
NAME                     READY   STATUS    RESTARTS   AGE
nginx-6799fc88d8-wjdl8   1/1     Running   0          12s
```
给这个pod开启一个端口转发
```bash
kubectl port-forward nginx-6799fc88d8-wjdl8 8000:80 --address=0.0.0.0
```
然后，访问端口，熟悉的nginx欢迎页面就出现了


到这里，microk8s 的环境就配置好啦！🎉
